import React, { useState, useContext, useEffect } from 'react';
import { Menu, X, ShoppingCart, User, Phone } from 'lucide-react';
import { AppContext } from '../contexts/AppContext';
import { CartItem } from '../types';
import { Customer, customerAuthService } from '../services/customerAuthService';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  const context = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  if (!context) {
    throw new Error('Header must be used within an AppProvider');
  }

  const { state } = context;
  const cartItemCount = state.cart.reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0
  );

  useEffect(() => {
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
    <header className="bg-gradient-to-r from-white via-[#faf6f0] to-white shadow-xl sticky top-0 z-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onViewChange('home')}
              className="flex items-center focus:outline-none"
            >
              <img
                src="/logo.svg"
                alt="Tina's Bakery Logo"
                className="h-12 w-auto object-contain drop-shadow-sm"
                style={{
                  filter:
                    'brightness(0) saturate(100%) invert(40%) sepia(76%) saturate(485%) hue-rotate(356deg) brightness(95%) contrast(92%)',
                }}
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-10">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 pb-1 border-b-2 ${
                  activeView === item.id
                    ? 'text-amber-700 border-amber-700'
                    : 'text-gray-700 border-transparent hover:text-amber-700 hover:border-amber-400'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-5">
            {/* Phone */}
            <a
              href="tel:+256771756461"
              className="hidden sm:flex items-center text-gray-700 hover:text-amber-700 transition-all duration-300"
            >
              <Phone className="h-5 w-5 mr-1" />
              <span className="text-sm font-medium">+256 771 756 461</span>
            </a>

            {/* Cart */}
            <button
              onClick={() => onViewChange('cart')}
              className="relative p-2 text-gray-700 hover:text-amber-700 transition-all duration-300"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Account */}
            <button
              onClick={() => onViewChange('account')}
              className={`p-2 transition-all duration-300 ${
                currentCustomer
                  ? 'text-amber-700 hover:text-amber-800'
                  : 'text-gray-700 hover:text-amber-700'
              }`}
            >
              <User className="h-6 w-6" />
            </button>
            {currentCustomer && (
              <div className="hidden sm:block text-xs font-medium text-gray-700">
                {currentCustomer.fullName}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-amber-700 transition-all duration-300"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-amber-200 bg-[#fffdf9] shadow-inner">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`text-left py-2 px-3 rounded-md font-medium tracking-wide transition-all duration-300 ${
                    activeView === item.id
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
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
        <div className="bg-red-600 text-white text-center py-2 shadow-md">
          <p className="text-sm font-semibold">Admin Mode Active</p>
        </div>
      )}
    </header>
  );
}
