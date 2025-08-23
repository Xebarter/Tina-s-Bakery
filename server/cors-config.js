// CORS configuration for the PesaPal server
const allowedOrigins = [
  'http://localhost:5173',         // Local development
  'https://tinas-bakery.vercel.app', // Production
  'https://tinas-backery.vercel.app', // Common typo
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // In production, only allow requests from the production domain
    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.some(allowedOrigin => 
        origin === allowedOrigin || 
        origin.endsWith('.tinas-bakery.vercel.app')
      )) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    
    // In development, allow all origins
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

export default corsOptions;
