import React from 'react';
import { CheckCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface PaymentSuccessProps {
  onViewChange: (view: string) => void;
}

export function PaymentSuccess({ onViewChange }: PaymentSuccessProps) {
  const { dispatch } = useApp();
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order') || 'UNKNOWN';

  // Clear cart when payment is successful
  React.useEffect(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your order! Your payment has been processed successfully.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="text-sm text-green-800">
              <strong>Order ID:</strong> {orderId}
            </div>
            <div className="text-sm text-green-700 mt-2">
              You will receive a confirmation email with your order details shortly.
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => onViewChange('menu')}
              className="w-full bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center justify-center"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              Continue Shopping
            </button>
            
            <button
              onClick={() => onViewChange('home')}
              className="w-full bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors inline-flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}