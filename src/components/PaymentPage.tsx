import { useState, useEffect } from 'react';
import { CreditCard, Lock, ArrowLeft, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { pesapalService, PaymentRequest } from '../services/pesapal';
import { customerAuthService } from '../services/customerAuthService';
import { addOrder } from '../services/supabase';

// Format currency in UGX
const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface PaymentPageProps {
  onViewChange: (view: string) => void;
}

export function PaymentPage({ onViewChange }: PaymentPageProps) {
  const { state, reloadCustomers, reloadOrders } = useApp();
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
      // 1. Register customer by phone number (if not exists)
      const now = new Date().toISOString();
      let customer;
      try {
        // Try to fetch existing customer by phone
        const phone = customerInfo.phone.trim();
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers?phone=eq.${encodeURIComponent(phone)}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Accept': 'application/json',
            },
          }
        );
        
        if (!res.ok) {
          console.error('Failed to fetch customer:', await res.text());
          throw new Error('Failed to check for existing customer');
        }
        
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          customer = data[0];
          console.log('Found existing customer:', customer);
        } else {
          // Create new customer
          // Generate a deterministic UUID from phone number for user_id
          const generateUserId = (phone: string) => {
            // Simple hash function to generate a deterministic UUID from phone
            const hash = phone.split('').reduce((acc, char) => {
              return ((acc << 5) - acc) + char.charCodeAt(0);
            }, 0);
            
            // Convert to a UUID-like string (version 4 format)
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (hash + Math.random() * 16) % 16 | 0;
              return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
          };

          const customerObj = {
            first_name: customerInfo.firstName,
            last_name: customerInfo.lastName,
            full_name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
            phone: customerInfo.phone,
            email: customerInfo.email || null,
            address: customerInfo.address || null,
            city: customerInfo.city || 'Kampala',
            country: 'Uganda',
            account_type: 'billing_only',
            isActive: true,
            registrationSource: 'order',
            created_at: now,
            updated_at: now,
            user_id: generateUserId(customerInfo.phone),
            totalOrders: 0,
            totalSpent: 0
          };
          try {
            console.log('Creating new customer with data:', customerObj);
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/customers`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Prefer': 'return=representation'
              },
              body: JSON.stringify(customerObj)
            });

            if (!response.ok) {
              const errorData = await response.text();
              console.error('Failed to create customer:', errorData);
              throw new Error(`Failed to create customer: ${errorData}`);
            }

            const newCustomer = await response.json();
            console.log('Created new customer:', newCustomer);
            customer = Array.isArray(newCustomer) ? newCustomer[0] : newCustomer;
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            console.error('Error in customer creation:', errorMessage);
            throw new Error(`Failed to create customer: ${errorMessage}`);
          }
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error in customer registration:', errorMessage);
        throw new Error(`Failed to register customer: ${errorMessage}`);
      }

      // 2. Store order in Supabase (no items array)
      const orderObj = {
        customer_id: customer.id,
        total: subtotal + tax,
        status: 'pending',
        order_date: now,
        payment_method: 'PesaPal',
        created_at: now,
        updated_at: now,
      };
      const order = await addOrder(orderObj as any);

      // 3. Store each cart item in order_items table
      for (const item of state.cart) {
        const product = 'product' in item ? item.product : item;
        const orderItemObj = {
          order_id: order.id,
          product_id: product.id,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: product.price * item.quantity,
          created_at: now,
        };
        // Direct REST API call for order_items (replace with supabase function if available)
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/order_items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify([orderItemObj]),
        });
      }

      // 4. Proceed with payment as before
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/pesapal/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      const response = await res.json();
      if (response.error) {
        throw new Error(response.error.message);
      }
      // Reload customers and orders so admin dashboard updates immediately
      await reloadCustomers();
      await reloadOrders();
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

  // const depositCurrency = 'UGX';

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
                const imageUrl = product.imageUrl ? String(product.imageUrl) : ((product as any).image ? String((product as any).image) : '/images/placeholder-product.jpg');
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