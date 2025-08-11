import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { pesapalService } from '../services/pesapal';
import { paymentLogger } from '../utils/paymentLogger';

interface PaymentCallbackPageProps {
  onViewChange: (view: string) => void;
}

export function PaymentCallbackPage({ onViewChange }: PaymentCallbackPageProps) {
  const { dispatch } = useApp();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const orderTrackingId = urlParams.get('OrderTrackingId');
        const merchantReference = urlParams.get('OrderMerchantReference');

        paymentLogger.logCallback({ orderTrackingId, merchantReference });

        // Get pending payment info from localStorage
        const pendingPaymentStr = localStorage.getItem('pendingPayment');
        
        if (!pendingPaymentStr) {
          setStatus('error');
          setMessage('No pending payment found');
          return;
        }

        const pendingPayment = JSON.parse(pendingPaymentStr);

        if (orderTrackingId) {
          // Check payment status with PesaPal
          const paymentStatus = await pesapalService.getTransactionStatus(orderTrackingId);
          
          if (paymentStatus.status === 'COMPLETED' || paymentStatus.payment_status_description === 'Completed') {
            // Payment successful
            setStatus('success');
            setMessage('Payment completed successfully!');
            
            // Create order in the system
            const newOrder = {
              id: `order-${Date.now()}`,
              customerId: pendingPayment.customerId || 'guest',
              customerPhone: pendingPayment.customerInfo?.phone,
              items: pendingPayment.cartItems,
              total: pendingPayment.amount,
              status: 'confirmed' as const,
              orderDate: new Date().toISOString(),
              paymentMethod: 'PesaPal',
              paymentStatus: 'completed' as const,
              paymentReference: merchantReference || orderTrackingId,
            };

            // Add order to state
            dispatch({ type: 'ADD_ORDER', payload: newOrder });
            
            // Clear cart
            dispatch({ type: 'CLEAR_CART' });
            
            // Store order details for display
            setOrderDetails({
              orderId: newOrder.id,
              amount: pendingPayment.amount,
              items: pendingPayment.cartItems,
              paymentReference: merchantReference || orderTrackingId,
            });

            // Clear pending payment
            localStorage.removeItem('pendingPayment');
            
          } else if (paymentStatus.status === 'FAILED' || paymentStatus.payment_status_description === 'Failed') {
            setStatus('failed');
            setMessage('Payment was not completed. Please try again.');
          } else {
            setStatus('loading');
            setMessage('Payment is still being processed...');
            
            // Check again after a delay
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid payment callback');
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setStatus('error');
        setMessage('An error occurred while processing your payment');
      }
    };

    handlePaymentCallback();
  }, [dispatch]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader className="h-16 w-16 text-amber-600 mx-auto mb-6 animate-spin" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Processing Payment</h1>
            <p className="text-lg text-gray-600 mb-8">
              {message || 'Please wait while we confirm your payment...'}
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">{message}</p>
            
            {orderDetails && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{orderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium">Ugx {(orderDetails.amount * 130).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Reference:</span>
                    <span className="font-medium text-sm">{orderDetails.paymentReference}</span>
                  </div>
                  <div className="border-t pt-2 mt-4">
                    <p className="text-sm text-gray-600 mb-2">Items Ordered:</p>
                    {orderDetails.items.map((item: any, index: number) => (
                      <div key={index} className="text-sm">
                        {item.quantity}x {item.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onViewChange('account')}
                className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center"
              >
                View Order History
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => onViewChange('menu')}
                className="border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-gray-600 mb-8">{message}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onViewChange('payment')}
                className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => onViewChange('cart')}
                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
            <p className="text-lg text-gray-600 mb-8">{message}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onViewChange('home')}
                className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
              >
                Go Home
              </button>
              <button
                onClick={() => onViewChange('contact')}
                className="border-2 border-amber-600 text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
        
        {/* Additional Information */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• You'll receive an email confirmation shortly</li>
            <li>• Your order will be prepared within 2-4 hours</li>
            <li>• We'll notify you when it's ready for pickup</li>
            <li>• Bring your order ID when collecting your items</li>
          </ul>
        </div>
      </div>
    </div>
  );
}