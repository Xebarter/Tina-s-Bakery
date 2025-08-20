// CORS configuration for the PesaPal server
const allowedOrigins = [
  'http://localhost:5173',         // Local development
  'https://tinas-bakery.vercel.app', // Production
  'https://tinas-backery.vercel.app', // Common typo
  '*', // Allow all origins in production
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow all origins in production
    if (process.env.NODE_ENV === 'production') return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

module.exports = corsOptions;
