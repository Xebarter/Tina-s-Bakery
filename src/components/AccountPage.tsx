import React, { useState } from 'react';
import { User, MapPin, Phone, Mail, Calendar, Star, Package, Gift, CreditCard, Shield, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { customerAuthService } from '../services/customerAuthService';
import { CustomerAuthModal } from './CustomerAuthModal';

interface AccountPageProps {
  onViewChange: (view: string) => void;
}

export function AccountPage({ onViewChange }: AccountPageProps) {
  const { state, dispatch } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    address: '',
    city: ''
  });

  // Load customer data on component mount
  React.useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const customer = customerAuthService.getCurrentCustomer();
      if (customer) {
        setCurrentCustomer(customer);
      }
    } catch (error) {
      console.error('Failed to load customer data:', error);
    }
  };

  const handleAuthSuccess = (customer: any) => {
    setCurrentCustomer(customer);
    setShowAuthModal(false);
    loadCustomerData();
  };

  const handleLogout = async () => {
    try {
      await customerAuthService.logout();
      setCurrentCustomer(null);
      onViewChange('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  React.useEffect(() => {
    if (currentCustomer && !isEditing) {
      setEditForm({
        fullName: currentCustomer.fullName || '',
        email: currentCustomer.email || '',
        address: currentCustomer.address || '',
        city: currentCustomer.city || ''
      });
    }
  }, [currentCustomer, isEditing]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCustomer && editForm.fullName.trim()) {
      customerAuthService.updateProfile(editForm)
        .then(updatedUser => {
          setCurrentCustomer(updatedUser);
          setIsEditing(false);
        })
        .catch(error => {
          console.error('Failed to update profile:', error);
        });
    } else {
      setIsEditing(false);
    }
  };

  const customerOrders = state.orders.filter(order => order.customerId === currentCustomer?.id);
  const customerCakeOrders = state.cakeOrders.filter(order => order.customerId === currentCustomer?.id);

  if (!currentCustomer) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-16">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Required</h2>
            <p className="text-gray-600 mb-8">
              Please sign in to view your account information and order history.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-amber-600 text-white py-3 rounded-md font-semibold hover:bg-amber-700 transition-colors"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
        
        <CustomerAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-amber-100 rounded-full p-3">
                <User className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back{currentCustomer.fullName ? `, ${currentCustomer.fullName.split(' ')[0]}` : ''}!
                </h1>
                <p className="text-gray-600">
                  Account created {new Date(currentCustomer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center text-amber-600 mb-1">
                  <Star className="h-5 w-5 mr-1" />
                  <span className="font-semibold">0 Points</span>
                </div>
                <p className="text-sm text-gray-600">Loyalty Balance</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <nav className="flex space-x-8 px-6 py-4 border-b">
            {[
              { id: 'profile', name: 'Profile', icon: User },
              { id: 'orders', name: 'Order History', icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-3 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-50 text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder="Enter your city"
                      />
                    </div>
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        className="bg-amber-600 text-white px-6 py-2 rounded-md font-medium hover:bg-amber-700 transition-colors"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Full Name</p>
                          <p className="font-medium">{currentCustomer.fullName}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{currentCustomer.phone}</p>
                        </div>
                      </div>
                      {currentCustomer.email && (
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium">{currentCustomer.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Address</p>
                          <p className="font-medium">{currentCustomer.address}, {currentCustomer.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Account Created</p>
                          <p className="font-medium">{new Date(currentCustomer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order History</h2>
                
                {/* Regular Orders */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
                  {customerOrders.length > 0 ? (
                    <div className="space-y-4">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium">Order #{order.id}</p>
                              <p className="text-sm text-gray-600">{new Date(order.orderDate).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <p className="font-semibold mt-1">Ugx {order.total.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <p key={idx} className="text-sm text-gray-600">
                                {item.quantity}x {item.name}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders yet</p>
                      <button
                        onClick={() => onViewChange('menu')}
                        className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Browse our menu
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Cake Orders */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Cake Orders</h3>
                  {customerCakeOrders.length > 0 ? (
                    <div className="space-y-4">
                      {customerCakeOrders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-medium">{order.cakeType} - {order.size}</p>
                              <p className="text-sm text-gray-600">Needed by: {order.neededBy}</p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                              <p className="font-semibold mt-1">Ugx {order.price.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Flavor: {order.flavor} | Frosting: {order.frosting}</p>
                            {order.customText && <p>Text: "{order.customText}"</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No custom cake orders yet</p>
                      <button
                        onClick={() => onViewChange('custom-cakes')}
                        className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Order a custom cake
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}