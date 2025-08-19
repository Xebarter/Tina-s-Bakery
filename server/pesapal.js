// Pesapal backend proxy for Tina's Bakery
// Requires: npm install express axios dotenv

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const BASE_URL = process.env.VITE_PESAPAL_BASE_URL;
const CONSUMER_KEY = process.env.VITE_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.VITE_PESAPAL_CONSUMER_SECRET;
const IPN_ID = process.env.VITE_PESAPAL_IPN_ID;
const CALLBACK_URL = process.env.VITE_PESAPAL_CALLBACK_URL;

// Get Pesapal access token
async function getAccessToken() {
  const url = `${BASE_URL}/api/Auth/RequestToken`;
  const body = {
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET
  };
  const { data } = await axios.post(url, body);
  return data.token;
}

// Submit order request
app.post('/api/pesapal/order', async (req, res) => {
  try {
    const token = await getAccessToken();
    const url = `${BASE_URL}/api/Transactions/SubmitOrderRequest`;
    const orderData = req.body;
    const response = await axios.post(url, orderData, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Pesapal order error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// Health check
app.get('/api/pesapal/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Pesapal backend running on port ${PORT}`);
});
