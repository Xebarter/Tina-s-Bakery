import React, { useState, useContext, useEffect, useRef } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && 
          menuRef.current && 
          !menuRef.current.contains(event.target as Node) &&
          menuButtonRef.current &&
          !menuButtonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // Add event listener when menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when menu is closed
      document.body.style.overflow = 'auto';
    }

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

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
              ref={menuButtonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-amber-700 transition-all duration-300 z-50"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-300 transform rotate-180" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <div 
          ref={menuRef}
          className={`fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden`}
        >
          {/* Overlay Background */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="relative h-full w-4/5 max-w-sm bg-gradient-to-b from-amber-50 to-white shadow-2xl overflow-y-auto">
            <div className="p-6">
              {/* Logo in Menu */}
              <div className="mb-8">
                <img
                  src="/logo.svg"
                  alt="Tina's Bakery Logo"
                  className="h-12 w-auto object-contain"
                  style={{
                    filter:
                      'brightness(0) saturate(100%) invert(40%) sepia(76%) saturate(485%) hue-rotate(356deg) brightness(95%) contrast(92%)',
                  }}
                />
              </div>
              
              {/* Navigation Links */}
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full text-left py-4 px-4 rounded-lg font-medium text-lg tracking-wide transition-all duration-300 flex items-center ${
                      activeView === item.id
                        ? 'bg-amber-100 text-amber-700 font-semibold shadow-inner'
                        : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'
                    }`}
                  >
                    {item.name}
                    {activeView === item.id && (
                      <span className="ml-auto text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </nav>
              
              {/* Contact Info */}
              <div className="mt-8 pt-6 border-t border-amber-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Contact Us
                </h3>
                <a
                  href="tel:+256771756461"
                  className="flex items-center text-gray-700 hover:text-amber-700 transition-colors mb-2"
                >
                  <Phone className="h-5 w-5 mr-2 text-amber-600" />
                  <span>+256 771 756 461</span>
                </a>
                {currentCustomer && (
                  <div className="mt-4 pt-4 border-t border-amber-100">
                    <div className="flex items-center">
                      <div className="bg-amber-100 rounded-full p-2 mr-3">
                        <User className="h-5 w-5 text-amber-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{currentCustomer.fullName}</p>
                        <button 
                          onClick={() => onViewChange('account')}
                          className="text-xs text-amber-600 hover:underline mt-1"
                        >
                          View Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
