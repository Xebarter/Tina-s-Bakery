import { useState, useEffect } from 'react';
import { Lock, Loader, CreditCard, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { Product } from '../types';
import { supabase } from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

// Types and Interfaces
interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface CartItem extends Product {
  quantity: number;
  id: string;
  price: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  price?: number;
}

export interface Order {
  id: string;
  customer_id: string;
  total: number;
  status: string;
  order_date: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  payment_status: string;
  shipping_address: string;
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

// Generate a deterministic UUID from phone number for user_id
const generateUserId = (phone: string): string => {
  const hash = phone.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  
  return `customer-${Math.abs(hash)}-${phone}`;
};

export function PaymentPage({ onViewChange }: PaymentPageProps) {
  const { state } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Kampala',
    postalCode: ''
  });

  // Calculate order totals
  const calculateSubtotal = (): number => {
    return state.cart.reduce<number>((sum, item) => {
      return sum + ((item.price || 0) * item.quantity);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.18; // 18% VAT in Uganda
  const total = subtotal + tax;

  // Load customer data on component mount
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (customer && !error) {
            const nameParts = (customer.full_name || '').split(' ');
            setCustomerInfo(prev => ({
              ...prev,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' '),
              email: customer.email || '',
              phone: customer.phone || '',
              address: customer.address || prev.address,
              city: customer.city || prev.city,
              postalCode: customer.postal_code || prev.postalCode
            }));
          }
        } else if (state.currentUser) {
          // Fallback to current user from app state
          setCustomerInfo(prev => ({
            ...prev,
            firstName: state.currentUser?.firstName || '',
            lastName: state.currentUser?.lastName || '',
            email: state.currentUser?.email || '',
            phone: state.currentUser?.phone || ''
          }));
        }
      } catch (error) {
        console.error('Error loading customer data:', error);
      }
    };

    loadCustomer();
  }, [state.currentUser]);

  // Handle input changes for the form
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const requiredFields: (keyof CustomerInfo)[] = ['firstName', 'lastName', 'phone', 'address', 'city'];
    const missingFields = requiredFields.filter(field => !customerInfo[field].trim());
    
    if (missingFields.length > 0) {
      setErrorMessage(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Basic email validation
    if (customerInfo.email && !/\S+@\S+\.\S+/.test(customerInfo.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  // Handle payment submission
  const handlePayment = async () => {
    if (!validateForm()) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage('');
      setPaymentStatus('processing');

      // 1. Sanitize phone number
      const phoneNumber = customerInfo.phone.replace(/\D/g, '');
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }
      
      // 2. Create or get customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', phoneNumber)
        .single();

      let customerId: string;
      
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const newCustomer = {
          id: generateUserId(phoneNumber),
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          full_name: `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
          email: customerInfo.email,
          phone: phoneNumber,
          address: customerInfo.address,
          city: customerInfo.city,
          postal_code: customerInfo.postalCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdCustomer, error } = await supabase
          .from('customers')
          .insert([newCustomer])
          .select('id')
          .single();

        if (error) throw error;
        customerId = createdCustomer.id;
      }

      // 3. Create order
      const orderId = uuidv4();
      const orderData = {
        id: orderId,
        customer_id: customerId,
        total: total,
        status: 'pending',
        order_date: new Date().toISOString(),
        payment_method: 'pesapal',
        payment_status: 'pending',
        shipping_address: `${customerInfo.address}, ${customerInfo.city}, Uganda`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (orderError) throw orderError;

      // 4. Create order items
      const orderItems = state.cart.map(item => ({
        id: uuidv4(),
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        created_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 5. Process payment (PesaPal integration would go here)
      // This is a placeholder for the actual PesaPal integration
      // In a real implementation, you would:
      // 1. Get a token from PesaPal
      // 2. Submit the payment request
      // 3. Redirect to PesaPal for payment
      
      setPaymentStatus('success');
      // Redirect or show success message
      
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred during payment');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render loading state
  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Processing Your Order</h2>
          <p className="mt-2 text-gray-600">Please wait while we process your payment...</p>
        </div>
      </div>
    );
  }

  // Render success state
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Payment Successful!</h2>
          <p className="mt-2 text-gray-600">Thank you for your order. We'll notify you when it's ready.</p>
          <button
            onClick={() => onViewChange('home')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render error state
  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Failed</h2>
          <p className="mt-2 text-gray-600">{errorMessage || 'An error occurred while processing your payment.'}</p>
          <button
            onClick={() => setPaymentStatus('idle')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty cart state
  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-600">Add some items to your cart before checking out.</p>
          <button
            onClick={() => onViewChange('menu')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  // Render payment form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>
            <p className="mt-2 text-sm text-gray-600">Complete your purchase with confidence</p>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <Lock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            <span>Secure SSL Encryption</span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Customer Information */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Contact Information</h2>
              
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                    First name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="first-name"
                      value={customerInfo.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                    Last name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="last-name"
                      value={customerInfo.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      id="email"
                      value={customerInfo.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street address *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">
                    Postal code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="postal-code"
                      value={customerInfo.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4">
                {state.cart.map((item) => (
                  <div key={item.id} className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 rounded-md overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400">
                          <CreditCard className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between text-sm">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="ml-4 font-medium text-gray-900">{formatUGX(item.price * item.quantity)}</p>
                      </div>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between text-base font-medium text-gray-900">
                  <p>Subtotal</p>
                  <p>{formatUGX(subtotal)}</p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
                  <p>Tax (18%)</p>
                  <p>{formatUGX(tax)}</p>
                </div>
                <div className="flex items-center justify-between text-base font-medium text-gray-900 mt-4 pt-4 border-t border-gray-200">
                  <p>Total</p>
                  <p>{formatUGX(total)}</p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isProcessing ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Processing...
                      </>
                    ) : (
                      'Pay Now'
                    )}
                  </button>
                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                  By completing your purchase, you agree to our{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
