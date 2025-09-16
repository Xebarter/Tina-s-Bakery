import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { AppProvider, useApp } from './contexts/AppContext';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { MenuPage } from './components/MenuPage';
import { CustomCakePage } from './components/CustomCakePage';
import { CartPage } from './components/CartPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { AccountPage } from './components/AccountPage';
import { ResponsiveAdminDashboard } from './components/ResponsiveAdminDashboard';
import AdminLogin from './components/AdminLogin';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PaymentPage } from './components/PaymentPage';
import { PaymentCallbackPage } from './components/PaymentCallbackPage';
import { PaymentSuccess } from './components/PaymentSuccess';
import { OrderTracking } from './components/OrderTracking';
import { ChatSystem } from './components/ChatSystem';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
// SEO component is imported for potential future use

// Default SEO configuration for the app
const defaultSEO = {
  title: "Tina's Bakery | Artisanal Baked Goods in Uganda & UAE",
  description: "Handcrafted artisanal baked goods made with love in Uganda & UAE. Fresh bread, pastries, cakes, and custom orders for all occasions.",
  image: "/images/og-image.jpg",
  siteName: "Tina's Bakery",
  twitterHandle: "@tinasbakery",
  canonicalUrl: "https://tinasbakery.com"
};

function AppContent() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle view changes by updating the URL
  const handleViewChange = (view: string) => {
    if (view === 'home') {
      navigate('/');
    } else {
      navigate(`/${view}`);
    }
  };

  // Update the current view when the URL changes
  useEffect(() => {
    const path = location.pathname.substring(1); // Remove the leading '/'
    if (path === '' || path === 'home') {
      // Handle home view
    } else if (path === 'admin') {
      // Admin view is handled by the route
    }
    // Other views are handled by the router
  }, [location]);

  // Get the current route for dynamic SEO
  const currentRoute = location.pathname.substring(1) || 'home';
  const pageTitles: Record<string, string> = {
    'home': 'Artisanal Baked Goods & Custom Cakes',
    'menu': 'Our Menu - Freshly Baked Goods',
    'custom-cakes': 'Custom Cakes - Design Your Perfect Cake',
    'about': 'Our Story - Tina\'s Bakery',
    'contact': 'Contact Us - Get in Touch',
    'cart': 'Your Shopping Cart',
    'account': 'My Account',
    'order-tracking': 'Track Your Order',
    'admin': 'Admin Dashboard'
  };

  const pageDescriptions: Record<string, string> = {
    'home': 'Discover handcrafted artisanal bread, pastries, and custom cakes made with love in Uganda & UAE.',
    'menu': 'Explore our delicious selection of freshly baked goods, bread, pastries, and desserts.',
    'custom-cakes': 'Design your dream cake with our custom cake service. Perfect for birthdays, weddings, and special occasions.',
    'about': 'Learn about our passion for baking and commitment to quality at Tina\'s Bakery.',
    'contact': 'Have questions? Contact our friendly team. We\'d love to hear from you!',
    'cart': 'Review your order and proceed to checkout with our secure payment system.',
    'account': 'Manage your account details, orders, and preferences.',
    'order-tracking': 'Track the status of your order in real-time.',
    'admin': 'Admin dashboard for managing Tina\'s Bakery content and orders.'
  };

  // Generate dynamic page title and description
  const pageTitle = pageTitles[currentRoute] || defaultSEO.title;
  const pageDescription = pageDescriptions[currentRoute] || defaultSEO.description;
  const fullTitle = `${pageTitle} | ${defaultSEO.siteName}`;
  const canonicalUrl = `${defaultSEO.canonicalUrl}${location.pathname}`;
  const isHomePage = currentRoute === 'home';

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <html lang="en" />
        <title>{fullTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content={isHomePage ? 'website' : 'article'} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={defaultSEO.image} />
        <meta property="og:site_name" content={defaultSEO.siteName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={defaultSEO.twitterHandle} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={defaultSEO.image} />
      </Helmet>
      
      <Header activeView={currentRoute} onViewChange={handleViewChange} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage onViewChange={handleViewChange} />} />
          <Route path="/home" element={<HomePage onViewChange={handleViewChange} />} />
          <Route path="/menu" element={<MenuPage onViewChange={handleViewChange} />} />
          <Route path="/custom-cakes" element={<CustomCakePage onViewChange={handleViewChange} />} />
          <Route path="/cart" element={<CartPage onViewChange={handleViewChange} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<AccountPage onViewChange={handleViewChange} />} />
          <Route path="/payment" element={<PaymentPage onViewChange={handleViewChange} />} />
          <Route path="/payment-callback" element={<PaymentCallbackPage onViewChange={handleViewChange} />} />
          <Route path="/payment-success" element={<PaymentSuccess onViewChange={handleViewChange} />} />
          <Route path="/order-tracking" element={<OrderTracking currentUser={state.currentUser} />} />
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute>
                <ResponsiveAdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<HomePage onViewChange={handleViewChange} />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-amber-400 mb-4">🥐 Tina's Bakery</h3>
              <p className="text-gray-300 mb-4">
                Fresh baked goods made daily with love and tradition since 2018.
              </p>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>Uganda & UAE</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><button onClick={() => handleViewChange('menu')} className="hover:text-amber-400">Menu</button></li>
                <li><button onClick={() => handleViewChange('custom-cakes')} className="hover:text-amber-400">Custom Cakes</button></li>
                <li><button onClick={() => handleViewChange('about')} className="hover:text-amber-400">About Us</button></li>
                <li><button onClick={() => handleViewChange('contact')} className="hover:text-amber-400">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Business Hours</h4>
              <div className="space-y-1 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Mon - Fri</span>
                  <span>6AM - 8PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>6AM - 9PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>7AM - 6PM</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3 text-sm text-gray-300">
                {/* Email */}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-amber-400" />
                  <a href="mailto:tinasbakery@gmail.com" className="hover:text-amber-400">
                    tinasbakery@gmail.com
                  </a>
                </div>
                
                {/* WhatsApp Numbers */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-amber-400" />
                    <span className="font-medium">WhatsApp:</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded">UG</span>
                      <a href="https://wa.me/256777756461" className="hover:text-amber-400" target="_blank" rel="noopener noreferrer">
                        +256 777 756 461
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded">UAE</span>
                      <a href="https://wa.me/971502833542" className="hover:text-amber-400" target="_blank" rel="noopener noreferrer">
                        +971 502 833 542
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Social Media */}
                <div className="mt-4">
                  <h5 className="font-medium mb-3">Follow Us</h5>
                  <div className="flex items-center gap-4">
                    {/* TikTok */}
                    <a 
                      href="https://www.tiktok.com/@tinasbakery2018" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-400 transition-colors"
                      title="Follow us on TikTok"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                      </svg>
                    </a>
                    
                    {/* Instagram */}
                    <a 
                      href="https://www.instagram.com/tinas_bakery_2018" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-400 transition-colors"
                      title="Follow us on Instagram"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    
                    {/* X (Twitter) */}
                    <a 
                      href="https://x.com/TinasBakery2018" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-amber-400 transition-colors"
                      title="Follow us on X"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Tina's Bakery. All rights reserved. | Made with ❤️ for our community</p>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 transition-colors z-40"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat System */}
      <ChatSystem
        currentUserId="user-123"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </HelmetProvider>
  );
}

export default App;