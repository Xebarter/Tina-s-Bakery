import React, { useState } from 'react';
import { Menu, X, ShoppingCart, User, Settings, Phone } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { useContext } from 'react';
import { CartItem } from '../types';
import { Customer } from '../services/customerAuthService';
import { customerAuthService } from '../services/customerAuthService';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  const context = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  
  if (!context) {
    throw new Error('Header must be used within an AppProvider');
  }
  
  const { state, dispatch } = context;
  const cartItemCount = state.cart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);

  React.useEffect(() => {
    const loadCustomer = async () => {
      try {
        const customer = await customerAuthService.getCurrentCustomer();
        if (customer) {
          setCurrentCustomer(customer as Customer);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    };
    loadCustomer();
  }, []);

  const navigation = [
    { name: 'Home', id: 'home' },
    { name: 'Menu', id: 'menu' },
    { name: 'Custom Cakes', id: 'custom-cakes' },
    { name: 'About', id: 'about' },
    { name: 'Contact', id: 'contact' },
    { name: 'Track Order', id: 'order-tracking' },
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onViewChange('home')}
              className="flex items-center focus:outline-none"
            >
              <img
                src="/logo.svg"
                alt="Tina's Bakery Logo"
                className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(51%) sepia(85%) saturate(573%) hue-rotate(360deg) brightness(94%) contrast(94%)' }}
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'text-amber-600 border-b-2 border-amber-600'
                    : 'text-gray-700 hover:text-amber-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Phone */}
            <a
              href="tel:555-123-4567"
              className="hidden sm:flex items-center text-gray-600 hover:text-amber-600 transition-colors"
            >
              <Phone className="h-4 w-4 mr-1" />
              <span className="text-sm">(555) 123-4567</span>
            </a>

            {/* Cart */}
            <button
              onClick={() => onViewChange('cart')}
              className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Account */}
            <button
              onClick={() => onViewChange('account')}
              className={`p-2 transition-colors ${
                currentCustomer
                  ? 'text-amber-600 hover:text-amber-700'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              <User className="h-6 w-6" />
            </button>
            {currentCustomer && (
              <div className="hidden sm:block text-xs text-gray-600">
                {currentCustomer ? currentCustomer.fullName : 'My Account'}
              </div>
            )}

            {/* Admin Mode Toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_ADMIN_MODE' })}
              className={`p-2 transition-colors ${
                state.isAdminMode
                  ? 'text-red-600 hover:text-red-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Settings className="h-6 w-6" />
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-amber-600 transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left py-2 px-3 rounded-md transition-colors ${
                    activeView === item.id
                      ? 'bg-amber-50 text-amber-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Admin Mode Indicator */}
      {state.isAdminMode && (
        <div className="bg-red-600 text-white text-center py-2">
          <p className="text-sm font-medium">Admin Mode Active</p>
        </div>
      )}
    </header>
  );
}
