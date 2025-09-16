import { PaymentRequest, PaymentResponse, PaymentStatus } from './pesapal';
import { paymentLogger } from '../utils/paymentLogger';

class PesaPalProxyService {
  private baseUrl: string;
  private isDevelopment: boolean;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    this.isDevelopment = import.meta.env.DEV || false;
  }

  async submitOrderRequest(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      paymentLogger.logRequest(paymentData, paymentData.id, paymentData.amount);
      console.log('Submitting payment request to:', `${this.baseUrl}/pesapal/order`);
      
      const response = await fetch(`${this.baseUrl}/pesapal/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      console.log('Payment request response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment request failed with response:', errorText);
        throw new Error(`Payment request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: PaymentResponse = await response.json();
      console.log('Payment request result:', result);
      
      paymentLogger.logResponse(result, paymentData.id, result.error ? 'error' : 'success');
      
      if (result.error) {
        throw new Error(`PesaPal Payment Error: ${result.error}`);
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
      
      const response = await fetch(`${this.baseUrl}/pesapal/status/${orderTrackingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Status check failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result: PaymentStatus = await response.json();
      
      paymentLogger.logResponse(result, orderTrackingId, 'success');
      
      return result;
    } catch (error) {
      console.error('Error getting transaction status:', error);
      paymentLogger.logError(error, orderTrackingId);
      throw error;
    }
  }
}

export const pesapalProxyService = new PesaPalProxyService();