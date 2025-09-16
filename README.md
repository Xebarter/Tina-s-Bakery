# Tina's Bakery

A bakery e-commerce application built with React, TypeScript, and Supabase.

## Features
- Product browsing and management
- Shopping cart functionality
- Order placement and tracking
- Customer management
- Admin dashboard
- Payment processing with PesaPal

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev:all`

## Payment Processing with PesaPal

### Development Setup

For development, the application uses a proxy server to handle PesaPal API requests. This avoids CORS issues and allows for easier testing.

#### Using Live Mode (Recommended for testing actual payments):
1. Make sure `MOCK_PAYMENTS=true` is NOT set in your `.env` file
2. Obtain PesaPal sandbox credentials from https://developer.pesapal.com/
3. Update your `.env` file with the sandbox credentials:
   ```
   PESAPAL_CONSUMER_KEY=your_sandbox_consumer_key
   PESAPAL_CONSUMER_SECRET=your_sandbox_consumer_secret
   PESAPAL_IPN_ID=your_sandbox_ipn_id
   ```
4. The application will now use real PesaPal sandbox API calls

#### Using Mock Mode (For quick UI testing):
1. Set `MOCK_PAYMENTS=true` in your `.env` file
2. This will simulate successful payments without actually calling the PesaPal API

### Production Setup

For production deployment:

1. Obtain your PesaPal API credentials:
   - Consumer Key
   - Consumer Secret
   - IPN ID (Instant Payment Notification ID)

2. Set the following environment variables:
   ```
   PESAPAL_CONSUMER_KEY=your_actual_consumer_key
   PESAPAL_CONSUMER_SECRET=your_actual_consumer_secret
   PESAPAL_IPN_ID=your_actual_ipn_id
   PESAPAL_CALLBACK_URL=https://yourdomain.com/payment-callback
   PESAPAL_BASE_URL=https://pay.pesapal.com/v3
   ```

3. Ensure your production server is configured to handle PesaPal's IPN (Instant Payment Notification) webhooks at:
   `https://yourdomain.com/api/pesapal/ipn`

4. Register your IPN URL with PesaPal:
   - Log into your PesaPal merchant account
   - Navigate to IPN Settings
   - Add your IPN URL: `https://yourdomain.com/api/pesapal/ipn`
   - Select HTTP Method: POST

### How Payments Work

1. Customer places an order and proceeds to checkout
2. Payment details are sent to our backend proxy server
3. Backend server securely communicates with PesaPal API
4. Customer is redirected to PesaPal to complete payment
5. PesaPal redirects customer back to our callback URL
6. Application checks payment status through our proxy
7. Order is confirmed and customer is shown success page

### Testing Payments

In development:
- With `MOCK_PAYMENTS=true`: All payments will be simulated as successful
- With `MOCK_PAYMENTS` not set or set to `false`: The application will attempt to use real PesaPal sandbox credentials

For testing with real sandbox credentials:
1. Sign up for a PesaPal merchant account at https://developer.pesapal.com/
2. Obtain sandbox credentials
3. Update your `.env` file with the sandbox credentials
4. Make sure `MOCK_PAYMENTS` is not set to `true`

## Deployment

The application can be deployed to any platform that supports Node.js and static file serving, such as Vercel, Netlify, or a traditional hosting provider.