import CryptoJS from 'crypto-js';
import { paymentLogger } from '../utils/paymentLogger';

// PesaPal configuration
const PESAPAL_CONFIG = {
  consumerKey: import.meta.env.VITE_PESAPAL_CONSUMER_KEY || 'nu6JUrYluZWKIK7kDq/bmAXsE+JZsOXx',
  consumerSecret: import.meta.env.VITE_PESAPAL_CONSUMER_SECRET || 'FJS6YRvsINWIn7oDoDLaLcfNehU=',
  ipnId: import.meta.env.VITE_PESAPAL_IPN_ID || '0d13da5d-3664-4ec7-b572-dbad588fe9ab',
  callbackUrl: import.meta.env.VITE_PESAPAL_CALLBACK_URL || 'http://localhost:5173/payment-callback',
  baseUrl: import.meta.env.VITE_PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3', // Sandbox URL
};

export interface PaymentRequest {
  id: string;
  currency: string;
  amount: number;
  description: string;
  callback_url: string;
  notification_id: string;
  billing_address: {
    email_address: string;
    phone_number: string;
    country_code: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    line_1?: string;
    line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    zip_code?: string;
  };
}

export interface PaymentResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  error?: {
    type: string;
    code: string;
    message: string;
    call_id: string;
  };
}

export interface PaymentStatus {
  payment_method: string;
  amount: number;
  created_date: string;
  confirmation_code: string;
  payment_status_description: string;
  description: string;
  message: string;
  payment_account: string;
  call_id: string;
  status_code: number;
  merchant_reference: string;
  account_number: string;
  status: string;
}

class PesaPalService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private async generateSignature(
    method: string,
    url: string,
    params: Record<string, any> = {}
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = CryptoJS.lib.WordArray.random(32).toString();

    const baseString = [
      method.toUpperCase(),
      encodeURIComponent(url),
      encodeURIComponent(
        Object.entries({
          oauth_consumer_key: PESAPAL_CONFIG.consumerKey,
          oauth_nonce: nonce,
          oauth_signature_method: 'HMAC-SHA1',
          oauth_timestamp: timestamp,
          oauth_version: '1.0',
          ...params,
        })
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      ),
    ].join('&');

    const signingKey = `${encodeURIComponent(PESAPAL_CONFIG.consumerSecret)}&`;
    const signature = CryptoJS.HmacSHA1(baseString, signingKey).toString(CryptoJS.enc.Base64);

    return `OAuth oauth_consumer_key="${PESAPAL_CONFIG.consumerKey}", oauth_nonce="${nonce}", oauth_signature="${encodeURIComponent(signature)}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${timestamp}", oauth_version="1.0"`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const url = `${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`;
      const authorization = await this.generateSignature('POST', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
        },
        body: JSON.stringify({
          consumer_key: PESAPAL_CONFIG.consumerKey,
          consumer_secret: PESAPAL_CONFIG.consumerSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`PesaPal Auth Error: ${data.error.message}`);
      }

      this.accessToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expiryDate || 3600) * 1000);
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting PesaPal access token:', error);
      throw error;
    }
  }

  async submitOrderRequest(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      paymentLogger.logRequest(paymentData, paymentData.id, paymentData.amount);
      
      const token = await this.getAccessToken();
      const url = `${PESAPAL_CONFIG.baseUrl}/api/Transactions/SubmitOrderRequest`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`Payment request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      paymentLogger.logResponse(result, paymentData.id, result.error ? 'error' : 'success');
      
      if (result.error) {
        throw new Error(`PesaPal Payment Error: ${result.error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Error submitting payment request:', error);
      paymentLogger.logError(error, paymentData?.id);
      throw error;
    }
  }

  async getTransactionStatus(orderTrackingId: string): Promise<PaymentStatus> {
    try {
      paymentLogger.logRequest({ orderTrackingId }, orderTrackingId);
      
      const token = await this.getAccessToken();
      const url = `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${response.statusText}`);
      }

      const result = await response.json();
      
      paymentLogger.logResponse(result, orderTrackingId, result.status);
      
      if (result.error) {
        throw new Error(`PesaPal Status Error: ${result.error.message}`);
      }

      return result;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      paymentLogger.logError(error, orderTrackingId);
      throw error;
    }
  }

  async registerIPN(url: string, ipnType: string = 'GET'): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const apiUrl = `${PESAPAL_CONFIG.baseUrl}/api/URLSetup/RegisterIPN`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          url,
          ipn_notification_type: ipnType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register IPN: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering IPN:', error);
      throw error;
    }
  }

  generateMerchantReference(): string {
    return `TINA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const pesapalService = new PesaPalService();