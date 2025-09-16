import axios from 'axios';

const BASE_URL = process.env.PESAPAL_BASE_URL || process.env.VITE_PESAPAL_BASE_URL || 'https://cybqa.pesapal.com/pesapalv3';
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || process.env.VITE_PESAPAL_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || process.env.VITE_PESAPAL_CONSUMER_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    res.json({ token: response.data.token });
    
  } catch (error) {
    console.error('Error getting PesaPal access token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    res.status(error.response?.status || 500).json({
      error: 'Failed to authenticate with PesaPal',
      details: error.response?.data || error.message
    });
  }
}
