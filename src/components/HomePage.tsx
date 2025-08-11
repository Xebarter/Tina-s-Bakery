import React from 'react';
import { Clock, MapPin, Star, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatUGX } from '../utils/currency';
import { HeroCarouselManager } from './HeroCarouselManager';
import { SeasonalSpecialsCarousel } from './SeasonalSpecialsCarousel';
import { ProductDetailModal } from './ProductDetailModal';

interface HomePageProps {
  onViewChange: (view: string) => void;
}

export function HomePage({ onViewChange }: HomePageProps) {
  const { state, dispatch } = useApp();
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [showProductModal, setShowProductModal] = React.useState(false);
  const signatureProducts = state.products.filter(product => product.isSignatureProduct);
  const seasonalProducts = state.products.filter(product => product.isSeasonalSpecial);
  // Map products to SeasonalSpecial shape for the carousel
  const seasonalSpecials = seasonalProducts.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    startDate: '2000-01-01', // always active
    endDate: '2100-01-01',   // always active
  }));

  const handleProductClick = (id: string) => {
    setSelectedProductId(id);
    setShowProductModal(true);
  };
  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProductId(null);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroCarouselManager onViewChange={onViewChange} />

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Signature Collection</h2>
            <p className="text-xl text-gray-600">Handcrafted with love using traditional recipes</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {signatureProducts.slice(0, 4).map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product.id)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${product.name}`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleProductClick(product.id); }}
              >
                <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
                  <div className="absolute top-4 right-4 bg-amber-600 text-white p-2 rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-amber-600">{formatUGX(product.price)}</span>
                    <div className="flex text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold mt-2"
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'ADD_TO_CART', payload: product }); }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Specials Carousel */}
      <SeasonalSpecialsCarousel
        specials={seasonalSpecials}
        products={seasonalProducts}
        onProductClick={handleProductClick}
      />

      {/* Business Info */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Hours */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <Clock className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Business Hours</h3>
              <div className="space-y-2 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>6:00 AM - 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>6:00 AM - 9:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>7:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <MapPin className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Visit Us</h3>
              <div className="text-gray-600">
                <p>123 Main Street</p>
                <p>Downtown District</p>
                <p>City, ST 12345</p>
                <p className="mt-2">(555) 123-4567</p>
              </div>
            </div>

            {/* Newsletter */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Stay Updated</h3>
              <p className="text-gray-600 mb-4 text-center">
                Get notified about new products and special offers!
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ProductDetailModal
        isOpen={showProductModal && !!selectedProductId}
        onClose={handleCloseModal}
        productId={selectedProductId || ''}
      />
    </div>
  );
}