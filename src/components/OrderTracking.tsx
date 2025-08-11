import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  CreditCard, 
  Phone, 
  Mail,
  Bell,
  BellOff,
  Calendar,
  User,
  Search
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatUGX } from '../utils/currency';
import { phoneAuthService } from '../services/phoneAuthService';

interface OrderTrackingProps {
  orderId?: string;
  currentUser?: any;
}

export function OrderTracking({ orderId, currentUser }: OrderTrackingProps) {
  const { state } = useApp();
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || '');
  const [searchInput, setSearchInput] = useState('');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    sms: false,
    push: true
  });

  // Filter orders for current user and by date
  const getUserOrders = () => {
    if (!currentUser) return [];
    
    const userOrders = state.orders.filter(order => 
      order.customerId === currentUser.id || order.customerId === currentUser.phone
    );
    
    if (!showAllOrders) {
      // Show only orders from last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      return userOrders.filter(order => 
        new Date(order.orderDate) >= threeMonthsAgo
      );
    }
    
    return userOrders;
  };

  const userOrders = getUserOrders().sort((a, b) => 
    new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
  );
  const order = state.orders.find(o => o.id === selectedOrderId);
  const customer = order ? state.customers.find(c => c.id === order.customerId) : null;

  const handleOrderSearch = () => {
    if (searchInput.trim()) {
      setSelectedOrderId(searchInput.trim());
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: Package },
      { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Clock },
      { key: 'ready', label: 'Ready for Pickup', icon: Truck },
      { key: 'completed', label: 'Completed', icon: CheckCircle }
    ];

    const currentIndex = steps.findIndex(step => step.key === order?.status);
    
    return steps.map((step, index) => ({
      ...step,
      isCompleted: index <= currentIndex,
      isCurrent: index === currentIndex,
      isUpcoming: index > currentIndex
    }));
  };

  const getEstimatedTime = () => {
    if (!order) return null;
    
    const orderTime = new Date(order.orderDate);
    const estimatedMinutes = {
      'pending': 15,
      'confirmed': 90,
      'preparing': 60,
      'ready': 0,
      'completed': 0
    };

    const minutes = estimatedMinutes[order.status as keyof typeof estimatedMinutes] || 0;
    const estimatedTime = new Date(orderTime.getTime() + minutes * 60000);
    
    return estimatedTime;
  };

  const updateNotificationPreference = (type: string, enabled: boolean) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: enabled
    }));
    // In real app, this would update the database
    console.log(`${type} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Tracking</h1>
            
            {/* Order ID Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Order ID
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter your order ID"
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleOrderSearch}
                  className="bg-amber-600 text-white px-6 py-2 rounded-md font-medium hover:bg-amber-700"
                >
                  <Search className="h-4 w-4 mr-2 inline" />
                  Track Order
                </button>
              </div>
            </div>

            {/* Recent Orders for logged-in users */}
            {currentUser && userOrders.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Your Orders {!showAllOrders && '(Last 3 Months)'}
                  </h3>
                  {!showAllOrders && (
                    <button
                      onClick={() => setShowAllOrders(true)}
                      className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                    >
                      View All Orders
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {userOrders.map((recentOrder) => (
                      <div
                        key={recentOrder.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedOrderId(recentOrder.id);
                          setSearchInput(recentOrder.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Order #{recentOrder.id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(recentOrder.orderDate).toLocaleDateString()} at{' '}
                              {new Date(recentOrder.orderDate).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {recentOrder.items.length} item{recentOrder.items.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{formatUGX(recentOrder.total * 130)}</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(recentOrder.status)}`}>
                              {recentOrder.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                
                {showAllOrders && userOrders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            )}
            
            {currentUser && userOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>You haven't placed any orders yet</p>
                <button
                  onClick={() => window.location.href = '/menu'}
                  className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
                >
                  Browse our menu
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();
  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.orderDate).toLocaleDateString()} at{' '}
                {new Date(order.orderDate).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">{formatUGX(order.total)}</p>
              <p className="text-sm text-gray-600">{order.items.length} items</p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200">
              <div 
                className="h-full bg-amber-600 transition-all duration-500"
                style={{ 
                  width: `${(statusSteps.findIndex(s => s.isCurrent) / (statusSteps.length - 1)) * 100}%` 
                }}
              />
            </div>

            {/* Status Steps */}
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    step.isCompleted 
                      ? 'bg-amber-600 border-amber-600 text-white' 
                      : step.isCurrent
                      ? 'bg-white border-amber-600 text-amber-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      step.isCompleted || step.isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </p>
                    {step.isCurrent && estimatedTime && (
                      <p className="text-xs text-amber-600 mt-1">
                        ETA: {estimatedTime.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Status Message */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <p className="font-medium text-amber-800">
                  {order.status === 'pending' && 'Your order has been received and is being reviewed.'}
                  {order.status === 'confirmed' && 'Your order has been confirmed and will be prepared soon.'}
                  {order.status === 'preparing' && 'Your order is currently being prepared by our bakers.'}
                  {order.status === 'ready' && 'Your order is ready for pickup!'}
                  {order.status === 'completed' && 'Your order has been completed. Thank you!'}
                </p>
                {estimatedTime && order.status !== 'completed' && (
                  <p className="text-sm text-amber-700 mt-1">
                    Estimated completion: {estimatedTime.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">{formatUGX(item.price * item.quantity)}</p>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-semibold text-amber-600">{formatUGX(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer & Payment Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              {customer && (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{customer.firstName} {customer.lastName}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">{customer.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">Pickup at store</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="text-gray-900">{order.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'completed' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">{formatUGX(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">Email Updates</span>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('email', !notificationPreferences.email)}
                    className={`p-1 rounded-full ${notificationPreferences.email ? 'text-amber-600' : 'text-gray-400'}`}
                  >
                    {notificationPreferences.email ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </button>
                </label>
                
                <label className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">SMS Updates</span>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('sms', !notificationPreferences.sms)}
                    className={`p-1 rounded-full ${notificationPreferences.sms ? 'text-amber-600' : 'text-gray-400'}`}
                  >
                    {notificationPreferences.sms ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </button>
                </label>
                
                <label className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-900">Push Notifications</span>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('push', !notificationPreferences.push)}
                    className={`p-1 rounded-full ${notificationPreferences.push ? 'text-amber-600' : 'text-gray-400'}`}
                  >
                    {notificationPreferences.push ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                  </button>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Phone className="h-4 w-4 mr-2" />
              Call (555) 123-4567
            </button>
            <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </button>
            <button className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Pickup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}