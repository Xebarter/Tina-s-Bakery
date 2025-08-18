import { useState, useEffect } from 'react';
import { CreditCard, Lock, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { pesapalService, PaymentRequest } from '../services/pesapal';
import { customerAuthService } from '../services/customerAuthService';
import { formatUGX } from '../utils/currency';
import { addCustomer, addOrder } from '../services/supabase';

interface PaymentPageProps {
  onViewChange: (view: string) => void;
}

export function PaymentPage({ onViewChange }: PaymentPageProps) {
  const { state } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const subtotal = state.cart.reduce((sum, item) => {
    const product = 'product' in item ? item.product : item;
    const price = 'price' in product ? product.price : 0;
    return sum + (price * item.quantity);
  }, 0);
  const tax = subtotal * 0.18; // 18% VAT in Uganda
  const total = subtotal + tax;

  useEffect(() => {
    const loadCustomer = async () => {
      const customer = customerAuthService.getCurrentCustomer();
      if (customer) {
        const nameParts = customer.fullName.split(' ');
        setCustomerInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: customer.email || '',
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          postalCode: ''
        });
      }
    };
    loadCustomer();
  }, []);

  useEffect(() => {
    if (state.currentUser) {
      setCustomerInfo({
        firstName: state.currentUser.firstName,
        lastName: state.currentUser.lastName,
        email: state.currentUser.email,
        phone: state.currentUser.phone,
        address: '',
        city: '',
        postalCode: ''
      });
    }
  }, [state.currentUser]);

  const handleInputChange = (field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const required = ['firstName', 'phone'];
    return required.every(field => customerInfo[field as keyof typeof customerInfo].trim() !== '');
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    if (state.cart.length === 0) {
      setErrorMessage('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      // 1. Store customer in Supabase (match schema)
      const now = new Date().toISOString();
      const customerObj = {
        // id: let Supabase auto-generate
        full_name: customerInfo.firstName + ' ' + customerInfo.lastName,
        phone: customerInfo.phone,
        email: customerInfo.email || null,
        address: customerInfo.address || 'N/A',
        city: customerInfo.city || 'N/A',
        country: 'Uganda',
        account_type: 'billing_only',
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      const customer = await addCustomer(customerObj);

      // 2. Store order in Supabase (match schema)
      const orderObj = {
        // id: let Supabase auto-generate
        customer_id: customer.id,
        total: subtotal + tax,
        status: 'pending',
        order_date: now,
        payment_method: 'PesaPal',
        created_at: now,
        updated_at: now,
      };
      await addOrder(orderObj);

      // 3. Proceed with payment as before
      const merchantReference = pesapalService.generateMerchantReference();
      const depositAmount = total;
      const depositCurrency = 'UGX';
      const paymentData: PaymentRequest = {
        id: merchantReference,
        currency: depositCurrency,
        amount: depositAmount,
        description: `Tina's Bakery Order - ${state.cart.length} items`,
        callback_url: `${window.location.origin}/payment-callback`,
        notification_id: import.meta.env.VITE_PESAPAL_IPN_ID || '0d13da5d-3664-4ec7-b572-dbad588fe9ab',
        billing_address: {
          email_address: customerInfo.email || 'noemail@example.com',
          phone_number: customerInfo.phone,
          country_code: 'UG',
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          line_1: customerInfo.address || 'N/A',
          city: customerInfo.city || 'Kampala',
          postal_code: customerInfo.postalCode || '256',
        },
      };
      const response = await pesapalService.submitOrderRequest(paymentData);
      if (response.error) {
        throw new Error(response.error.message);
      }
      localStorage.setItem('pendingPayment', JSON.stringify({
        merchantReference,
        orderTrackingId: response.order_tracking_id,
        amount: depositAmount,
        customerInfo,
        cartItems: state.cart,
        customerId: customer.id
      }));
      window.location.href = response.redirect_url;
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Items to Pay For</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your cart is empty. Please add some items before proceeding to payment.
          </p>
          <button
            onClick={() => onViewChange('menu')}
            className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const depositCurrency = 'UGX';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
            <p className="text-gray-600 mt-2">Complete your order with PesaPal</p>
          </div>
          <button
            onClick={() => onViewChange('cart')}
            className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="email@example.com (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+254 700 000 000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={customerInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={customerInfo.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </form>

            {/* Payment Methods */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <img
                    src="https://www.pesapal.com/sites/default/files/pesapal-logo.png"
                    alt="PesaPal"
                    className="h-8 mr-3"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">PesaPal Secure Payment</p>
                    <p className="text-sm text-gray-600">
                      Pay with M-Pesa, Airtel Money, Credit/Debit Cards, or Bank Transfer
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h3>

            <div className="space-y-6 mb-6">
              {state.cart.map((item, index) => {
                // Handle both nested product structure and direct product properties
                const product = 'product' in item ? item.product : item;
                const imageUrl = ('image' in product && product.image) ? String(product.image) : 
                               ('imageUrl' in product && product.imageUrl) ? String(product.imageUrl) : 
                               '/images/placeholder-product.jpg';
                const productName = 'name' in product ? product.name as string : 'Product';
                const productPrice = 'price' in product ? Number(product.price) : 0;
                const itemId = ('id' in item && item.id) ? String(item.id) : `item-${index}`;
                
                return (
                  <div key={itemId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="relative group flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={productName}
                          className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-lg border-2 border-gray-200 group-hover:border-amber-400 transition duration-200 shadow-sm bg-white"
                          onError={e => { e.currentTarget.src = '/images/placeholder-product.jpg'; }}
                        />
                        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-amber-500/10 transition duration-200"></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-lg text-gray-900 mb-1">{productName}</h4>
                        <p className="text-sm text-gray-600 mb-2">Qty: {item.quantity}</p>
                        <p className="font-medium text-amber-600">
                          {formatUGX(productPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatUGX(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">VAT (18%)</span>
                <span className="font-medium">{formatUGX(tax)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold text-amber-600">
                    {formatUGX(total)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isProcessing || !validateForm()}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader className="animate-spin mr-2 h-5 w-5" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Pay
                </>
              )}
            </button>

            <div className="mt-4 text-center text-sm text-gray-600">
              <div className="flex items-center justify-center">
                <Lock className="h-4 w-4 mr-1" />
                <span>Secured by PesaPal SSL encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Secure Payment Guarantee</h4>
              <p className="text-green-700 text-sm mt-1">
                Your payment information is encrypted and secure. We never store your payment details.
                All transactions are processed through PesaPal's secure payment gateway.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}