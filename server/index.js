// Main server entry point for Tina's Bakery
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import corsOptions from './cors-config.js';
import pesapalRouter from './pesapal.js';

// Configure environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mockPayments: process.env.MOCK_PAYMENTS || 'not set',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Mount PesaPal routes
app.use('/api', pesapalRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  app.use(express.static(join(__dirname, '../../dist')));
  
  // Handle SPA routing
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../dist/index.html'));
  });
}

// Export the Express API for Vercel
const createServer = () => app;

// Start the server in development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Mock Payments: ${process.env.MOCK_PAYMENTS || 'not set (using live mode)'}`);
  });
}

export { createServer };

export default (req, res) => {
  return createServer().handle(req, res);
};