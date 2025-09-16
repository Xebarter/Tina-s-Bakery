import axios from 'axios';

const BASE_URL = process.env.PESAPAL_BASE_URL || process.env.VITE_PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || process.env.VITE_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || process.env.VITE_PESAPAL_CONSUMER_SECRET;
const IPN_ID = process.env.PESAPAL_IPN_ID || process.env.VITE_PESAPAL_IPN_ID;
const CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL || process.env.VITE_PESAPAL_CALLBACK_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1) Get Pesapal access token
    const authUrl = `${BASE_URL}/api/Auth/RequestToken`;
    const authBody = { consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET };

    const authResp = await axios.post(authUrl, authBody, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      timeout: 15000
    });

    const token = authResp.data?.token;
    if (!token) {
      throw new Error('No access token received from PesaPal');
    }

    // 2) Submit order
    const orderUrl = `${BASE_URL}/api/Transactions/SubmitOrderRequest`;

    const orderData = {
      ...req.body,
      callback_url: req.body.callback_url || CALLBACK_URL,
      notification_id: req.body.notification_id || IPN_ID,
      ipn_notification_type: req.body.ipn_notification_type || 'POST'
    };

    const response = await axios.post(orderUrl, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Pesapal order error:', {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data
    });

    return res.status(error.response?.status || 500).json({
      error: 'Failed to process payment',
      details: error.response?.data || error.message
    });
  }
}
