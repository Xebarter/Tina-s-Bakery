// Pesapal backend proxy for Tina's Bakery
import express from 'express';
import axios from 'axios';

const router = express.Router();

const BASE_URL = process.env.VITE_PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3';
const CONSUMER_KEY = process.env.VITE_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.VITE_PESAPAL_CONSUMER_SECRET;
const IPN_ID = process.env.VITE_PESAPAL_IPN_ID;

// Use different callback URL based on environment
const CALLBACK_URL = process.env.NODE_ENV === 'production' 
  ? 'https://tinas-bakery.vercel.app/payment-callback'
  : process.env.VITE_PESAPAL_CALLBACK_URL || 'http://localhost:5173/payment-callback';

console.log('PesaPal Config:', { 
  baseUrl: BASE_URL,
  callbackUrl: CALLBACK_URL,
  ipnId: IPN_ID 
});

// Get Pesapal access token
async function getAccessToken() {
  try {
    const url = `${BASE_URL}/api/Auth/RequestToken`;
    const body = {
      consumer_key: CONSUMER_KEY,
      consumer_secret: CONSUMER_SECRET
    };
    
    console.log('Requesting PesaPal access token...');
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.data.token) {
      throw new Error('No access token received from PesaPal');
    }
    
    console.log('Successfully obtained PesaPal access token');
    return response.data.token;
  } catch (error) {
    console.error('Error getting PesaPal access token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error('Failed to authenticate with PesaPal');
  }
}

// Submit order request
router.post('/pesapal/order', async (req, res) => {
  try {
    console.log('Received PesaPal order request:', JSON.stringify(req.body, null, 2));
    
    const token = await getAccessToken();
    const url = `${BASE_URL}/api/Transactions/SubmitOrderRequest`;
    
    const orderData = {
      ...req.body,
      callback_url: CALLBACK_URL,
      notification_id: IPN_ID,
      ipn_notification_type: 'POST'
    };

    console.log('Sending order to PesaPal:', JSON.stringify(orderData, null, 2));
    
    const response = await axios.post(url, orderData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('PesaPal order response:', JSON.stringify(response.data, null, 2));
    res.json(response.data);
    
  } catch (error) {
    console.error('PesaPal order error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    
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
    timestamp: new Date().toISOString()
  });
});

export default router;
