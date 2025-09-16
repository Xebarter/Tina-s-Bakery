// Pesapal backend proxy for Tina's Bakery
import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';

// Configure environment variables
dotenv.config();

const router = express.Router();

// Log all environment variables for debugging
console.log('=== ENVIRONMENT VARIABLES ===');
console.log({
  PESAPAL_BASE_URL: process.env.PESAPAL_BASE_URL,
  PESAPAL_CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY ? 'SET' : 'MISSING',
  PESAPAL_CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET ? 'SET' : 'MISSING',
  PESAPAL_IPN_ID: process.env.PESAPAL_IPN_ID,
  PESAPAL_CALLBACK_URL: process.env.PESAPAL_CALLBACK_URL,
  VITE_PESAPAL_CALLBACK_URL: process.env.VITE_PESAPAL_CALLBACK_URL,
  NODE_ENV: process.env.NODE_ENV,
  MOCK_PAYMENTS: process.env.MOCK_PAYMENTS
});
console.log('=============================');

// Determine if we're using production or sandbox
const isProduction = process.env.PESAPAL_BASE_URL && process.env.PESAPAL_BASE_URL.includes('pay.pesapal.com');
const BASE_URL = process.env.PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET;
const IPN_ID = process.env.PESAPAL_IPN_ID;

// Use different callback URL based on environment
const CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tinas-bakery.vercel.app/payment-callback'
    : 'http://localhost:5173/payment-callback');

console.log('=== PESAPAL SERVER CONFIGURATION ===');
console.log('PesaPal Config:', { 
  baseUrl: BASE_URL,
  callbackUrl: CALLBACK_URL,
  ipnId: IPN_ID,
  mockPayments: process.env.MOCK_PAYMENTS,
  nodeEnv: process.env.NODE_ENV,
  consumerKey: CONSUMER_KEY ? 'SET' : 'MISSING',
  consumerSecret: CONSUMER_SECRET ? 'SET' : 'MISSING'
});
console.log('====================================');

// Get Pesapal access token
async function getAccessToken() {
  console.log('=== GET ACCESS TOKEN ===');
  console.log('MOCK_PAYMENTS env var:', process.env.MOCK_PAYMENTS);
  console.log('MOCK_PAYMENTS === true:', process.env.MOCK_PAYMENTS === 'true');
  
  // Only use mock payments when explicitly enabled
  if (process.env.MOCK_PAYMENTS === 'true') {
    console.log('Using mock PesaPal token for development');
    return 'mock-token-for-development';
  }
  
  try {
    // Use the correct authentication endpoint based on environment
    const authEndpoint = isProduction 
      ? `${BASE_URL}/api/Auth/RequestToken`
      : `${BASE_URL}/api/Auth/RequestToken`; // Same endpoint but different base URL
    const url = authEndpoint;
    const body = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    };
    
    console.log('Requesting PesaPal access token...', { 
      environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
      url,
      baseUrl: BASE_URL,
      hasConsumerKey: !!CONSUMER_KEY,
      hasConsumerSecret: !!CONSUMER_SECRET
    });
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('PesaPal token response:', response.data);
    
    if (!response.data || !response.data.token) {
      throw new Error('No access token received from PesaPal');
    }
    
    console.log('Successfully obtained PesaPal access token');
    return response.data.token;
  } catch (error) {
    console.error('Error getting PesaPal access token:', {
      environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
      url,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    
    // Removed fallback to mock token - we want to fail fast in non-development environments
    // and only use mock mode when explicitly enabled
    
    throw new Error('Failed to authenticate with PesaPal');
  }
}

// Submit order request
router.post('/pesapal/order', async (req, res) => {
  const requestId = Date.now();
  
  try {
    console.log(`=== PESAPAL ORDER REQUEST [${requestId}] ===`);
    console.log('Request headers:', req.headers);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Received PesaPal order request:', JSON.stringify(req.body, null, 2));
    
    const token = await getAccessToken();
    console.log('Using token:', token ? 'REAL TOKEN' : 'NO TOKEN', token?.startsWith('mock-') ? '(MOCK)' : '(REAL)');
    
    // If using mock token, return mock response
    if (token && token.startsWith('mock-')) {
      console.log('Returning mock PesaPal order response for development');
      const mockResponse = {
        order_tracking_id: 'mock-tracking-' + Date.now(),
        merchant_reference: req.body.id,
        redirect_url: `http://localhost:5173/payment-callback?OrderTrackingId=mock-tracking-${Date.now()}&OrderMerchantReference=${req.body.id}`,
        error: null,
        status: '200'
      };
      
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return res.json(mockResponse);
    }
    
    const url = `${BASE_URL}/api/Transactions/SubmitOrderRequest`;
    
    // Prepare the order data according to PesaPal v3 API requirements
    const orderData = {
      id: req.body.id, // Unique order ID from your system
      currency: req.body.currency || 'KES', // Default to KES if not provided
      amount: parseFloat(req.body.amount),
      description: req.body.description,
      callback_url: CALLBACK_URL,
      notification_id: IPN_ID,
      billing_address: {
        email_address: req.body.customer_email,
        phone_number: req.body.customer_phone,
        country_code: req.body.country_code || 'KE',
        first_name: req.body.first_name || 'Customer',
        last_name: req.body.last_name || 'Name'
      }
    };
    
    // Add optional fields if they exist in the request
    if (req.body.redirect_mode) {
      orderData.redirect_mode = req.body.redirect_mode; // 'TOP_WINDOW' or 'PARENT_WINDOW'
    }
    if (req.body.branch) {
      orderData.branch = req.body.branch;
    }

    console.log('Sending order to PesaPal:', JSON.stringify(orderData, null, 2));
    
    console.log('Sending order to PesaPal v3 API:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(url, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip,deflate,br'
      },
      timeout: 30000, // 30 second timeout
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    // Log the raw response for debugging
    console.log('PesaPal API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    
    console.log('PesaPal order response:', JSON.stringify(response.data, null, 2));
    console.log('Sending real response:', response.data);
    res.json(response.data);
    
  } catch (error) {
    console.error('=== PESAPAL ORDER ERROR ===');
    console.error('PesaPal order error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
    // Only provide fallback in development when not using MOCK_PAYMENTS
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_PAYMENTS !== 'true') {
      console.log('Providing mock payment response as fallback for development');
      return res.json({
        order_tracking_id: 'fallback-tracking-' + Date.now(),
        merchant_reference: req.body.id,
        redirect_url: `http://localhost:5173/payment-callback?OrderTrackingId=fallback-tracking-${Date.now()}&OrderMerchantReference=${req.body.id}`,
        error: null,
        status: '200'
      });
    }
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to process payment',
      details: error.response?.data || error.message
    });
  }
});

// Health check endpoint
router.get('/pesapal/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'pesapal',
    timestamp: new Date().toISOString(),
    config: {
      baseUrl: BASE_URL,
      callbackUrl: CALLBACK_URL,
      ipnId: IPN_ID,
      mockPayments: process.env.MOCK_PAYMENTS,
      nodeEnv: process.env.NODE_ENV,
      consumerKey: CONSUMER_KEY ? 'SET' : 'MISSING',
      consumerSecret: CONSUMER_SECRET ? 'SET' : 'MISSING'
    }
  });
});

// Test endpoint to verify PesaPal connectivity
router.get('/pesapal/test', async (req, res) => {
  try {
    console.log('=== PESAPAL CONNECTIVITY TEST ===');
    
    if (process.env.MOCK_PAYMENTS === 'true') {
      return res.json({
        status: 'success',
        mode: 'mock',
        message: 'Mock mode is enabled. Payments will be simulated.'
      });
    }
    
    const token = await getAccessToken();
    
    if (token && token.startsWith('mock-')) {
      return res.json({
        status: 'success',
        mode: 'mock',
        message: 'Using mock token. Payments will be simulated.'
      });
    }
    
    res.json({
      status: 'success',
      mode: 'live',
      message: 'Live mode is enabled. Real payments will be processed.',
      token: token ? 'RECEIVED' : 'NOT RECEIVED'
    });
  } catch (error) {
    console.error('PesaPal connectivity test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to PesaPal',
      error: error.message
    });
  }
});

export default router;
