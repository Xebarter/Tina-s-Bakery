import React, { useState, useMemo } from 'react';
import { Lock, Loader, CreditCard, CheckCircle, ShoppingBag, XCircle, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../services/supabase';
import { pesapalProxyService, PaymentRequest } from '../services/pesapalProxy';

// Types
interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface PaymentPageProps {
  onViewChange: (view: string) => void;
}

// Format currency in UGX
const formatUGX = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function PaymentPage({ onViewChange }: PaymentPageProps) {
  const { state } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kampala',
    postalCode: ''
  });

  // Calculate totals - memoized
  const { subtotal, tax, total } = useMemo(() => {
    const subtotal = state.cart.reduce((sum, item) => {
      const product = item.product || item;
      return sum + (product.price * item.quantity);
    }, 0);
    
    const tax = subtotal * 0.18;
    return { subtotal, tax, total: subtotal + tax };
  }, [state.cart]);

  // Form validation - memoized
  const isFormValid = useMemo(() => {
    return !!(
      customerInfo.firstName && 
      customerInfo.lastName && 
      customerInfo.phone && 
      customerInfo.address
    );
  }, [customerInfo.firstName, customerInfo.lastName, customerInfo.phone, customerInfo.address]);

  // Handle input changes
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }));
  };

  // Get PesaPal token
  const getPesaPalToken = async (): Promise<string> => {
    try {
      // We don't need to manually get the token, the pesapalService handles it internally
      // This function is kept for backward compatibility but doesn't do anything now
      return 'token-handled-internally';
    } catch (error) {
      console.error('Error getting PesaPal token:', error);
      throw error;
    }
  };

  // Create customer in database
  const createCustomer = async () => {
    try {
      const phoneNumber = customerInfo.phone.replace(/\D/g, '');
      
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      const customerData = {
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        full_name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
        phone: phoneNumber,
        email: customerInfo.email || null,
        address: customerInfo.address || null,
        city: customerInfo.city || 'Kampala',
        country: 'Uganda',
        account_type: 'billing_only',
        is_active: true,
        registration_source: 'order',
        total_orders: 0,
        total_spent: 0
      };

      // Try to create customer (if it fails due to RLS, we'll use the data anyway)
      let customer: any;
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();
        
        if (error) throw error;
        customer = data;
      } catch (dbError: any) {
        console.log('Database customer creation failed, using local data:', dbError.message);
        customer = { id: uuidv4(), ...customerData };
      }

      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  };

  // Create order in database
  const createOrder = async (customer: any, orderId: string) => {
    try {
      const now = new Date().toISOString();
      const orderData = {
        id: orderId,
        customer_id: customer.id,
        total: total,
        status: 'pending',
        order_date: now,
        payment_method: 'PesaPal',
        payment_status: 'pending',
        notes: `Address: ${customerInfo.address || ''}`,
        created_at: now,
        updated_at: now
      };

      // Try to create order (if it fails due to RLS, we'll store in localStorage)
      let order: any;
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (error) throw error;
        order = data;

        // Create order items
        const orderItems = state.cart.map(item => {
          const product = item.product || item;
          return {
            order_id: order.id,
            product_id: product.id,
            quantity: item.quantity,
            unit_price: product.price,
            total_price: product.price * item.quantity,
            created_at: now
          };
        });

        await supabase.from('order_items').insert(orderItems);
        
      } catch (dbError: any) {
        console.log('Database order creation failed, storing locally:', dbError.message);
        order = orderData;
        
        // Store in localStorage as backup
        const localOrderData = {
          ...orderData,
          customer,
          items: state.cart.map(item => ({
            product: item.product || item,
            quantity: item.quantity
          }))
        };
        localStorage.setItem(`order_${orderId}`, JSON.stringify(localOrderData));
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (!isFormValid) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');

      // 1. Generate order ID and store customer/order data locally
      const orderId = uuidv4();
      const customerData = {
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phone: customerInfo.phone,
        email: customerInfo.email || '',
        address: customerInfo.address,
        city: customerInfo.city || 'Kampala',
        postalCode: customerInfo.postalCode || ''
      };

      const orderData = {
        id: orderId,
        customer: customerData,
        items: state.cart,
        subtotal,
        tax,
        total,
        timestamp: new Date().toISOString()
      };

      // Store order locally for now
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
      console.log('Order stored locally:', orderId);

      // Store pending payment information for callback
      const pendingPayment = {
        orderId,
        amount: total,
        customerInfo,
        cartItems: state.cart.map(item => ({
          ...item,
          product: item.product || item
        })),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('pendingPayment', JSON.stringify(pendingPayment));

      // 2. Submit order to PesaPal via our proxy service
      console.log('Submitting to PesaPal through proxy...');
      
      // Prepare payment data according to PesaPal v3 API
      const paymentData: PaymentRequest = {
        id: orderId,
        currency: 'UGX',
        amount: total,
        description: `Order #${orderId} - Tina's Bakery`,
        callback_url: window.location.origin + '/payment-callback',
        notification_id: import.meta.env.VITE_PESAPAL_IPN_ID || '',
        billing_address: {
          email_address: customerInfo.email || 'customer@tinasbakery.com', // Fallback email if not provided
          phone_number: customerInfo.phone || '256700000000', // Fallback phone if not provided
          first_name: customerInfo.firstName || 'Customer',
          last_name: customerInfo.lastName || 'Name',
          country_code: 'UG',
          // Optional fields
          ...(customerInfo.address && { line_1: customerInfo.address }),
          ...(customerInfo.city && { city: customerInfo.city }),
          ...(customerInfo.postalCode && { postal_code: customerInfo.postalCode })
        },
        // Optional parameters
        redirect_mode: 'TOP_WINDOW' // or 'PARENT_WINDOW'
      };
      
      // Log the payment data being sent (without sensitive info)
      console.log('Payment request data:', {
        ...paymentData,
        billing_address: {
          ...paymentData.billing_address,
          email_address: paymentData.billing_address.email_address ? '***@***.com' : 'missing',
          phone_number: paymentData.billing_address.phone_number ? '***' : 'missing'
        }
      });

      console.log('Payment data being sent:', paymentData);
      const paymentResponse = await pesapalProxyService.submitOrderRequest(paymentData);
      console.log('Payment response received:', paymentResponse);

      // 3. Redirect to payment page
      if (paymentResponse.redirect_url) {
        console.log('Redirecting to:', paymentResponse.redirect_url);
        window.location.href = paymentResponse.redirect_url;
      } else {
        throw new Error('No redirect URL received from payment gateway');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An error occurred while processing your payment. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Show empty cart message
  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-lg text-gray-600 mb-8">
            Add some items to your cart before proceeding to checkout
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Billing Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Lock className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Billing Information</h2>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <XCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                  <span className="text-red-700">{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
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
                  placeholder="+256 700 000 000"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
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
            </div>

            {/* Payment Method */}
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
                const product = item.product || item;
                const imageUrl = (product as any).image || '/images/placeholder-product.jpg';
                const itemId = product.id || `item-${index}`;

                return (
                  <div key={itemId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                          onError={e => { e.currentTarget.src = '/images/placeholder-product.jpg'; }}
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg text-gray-900 mb-1">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">Qty: {item.quantity}</p>
                        <p className="font-medium text-amber-600">
                          {formatUGX(product.price * item.quantity)}
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
              disabled={isProcessing || !isFormValid}
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
                  Pay {formatUGX(total)}
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
