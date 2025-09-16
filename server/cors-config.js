// CORS configuration for the PesaPal server
const allowedOrigins = [
  'http://localhost:5173',         // Local development
  'https://tinas-bakery.vercel.app', // Production
  'https://tinas-backery.vercel.app', // Common typo
  // Add any other domains that should be allowed
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in our allowed list
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || 
      origin.startsWith(allowedOrigin)
    )) {
      return callback(null, true);
    }
    
    // In production, be strict about CORS
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow all origins for easier testing
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

export default corsOptions;