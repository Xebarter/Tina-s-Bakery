/// <reference types="@vercel/node" />

// Extend the NodeJS namespace to include Vercel's environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    
    // PesaPal
    VITE_PESAPAL_CONSUMER_KEY: string;
    VITE_PESAPAL_CONSUMER_SECRET: string;
    VITE_PESAPAL_IPN_ID: string;
    VITE_PESAPAL_CALLBACK_URL: string;
    VITE_PESAPAL_BASE_URL: string;
    
    // Node Environment
    NODE_ENV: 'development' | 'production' | 'test';
    
    // Vercel Environment
    VERCEL_ENV?: 'development' | 'preview' | 'production';
    VERCEL_URL?: string;
    VERCEL_GIT_COMMIT_REF?: string;
  }
}
