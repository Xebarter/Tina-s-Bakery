import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Star } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatUGX } from '../utils/currency';

interface SeasonalSpecial {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  startDate: string;
  endDate: string;
  badge?: string;
}

interface SeasonalSpecialsCarouselProps {
  specials: SeasonalSpecial[];
  products: any[];
  onProductClick?: (id: string) => void;
  autoRotate?: boolean;
  rotationInterval?: number;
  animationStyle?: 'slide' | 'fade' | 'scale';
  animationDuration?: number;
}

export const SeasonalSpecialsCarousel: React.FC<SeasonalSpecialsCarouselProps> = ({
  specials = [],
  products = [],
  onProductClick,
  autoRotate = true,
  rotationInterval = 5000,
  animationStyle = 'slide',
  animationDuration = 300
}) => {
  const { dispatch } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter active specials
  const activeSpecials = specials.filter(special => {
    const now = new Date();
    const start = new Date(special.startDate);
    const end = new Date(special.endDate);
    return now >= start && now <= end;
  });

  useEffect(() => {
    if (!autoRotate || activeSpecials.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [currentIndex, autoRotate, rotationInterval, activeSpecials.length]);

  const nextSlide = () => {
    if (isAnimating || activeSpecials.length <= 1) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % activeSpecials.length);
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  const prevSlide = () => {
    if (isAnimating || activeSpecials.length <= 1) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + activeSpecials.length) % activeSpecials.length);
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  if (activeSpecials.length === 0) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 text-center">
        <div className="text-amber-600 mb-2">
          <Clock className="w-8 h-8 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Seasonal Specials</h3>
        <p className="text-gray-600">Check back soon for our latest seasonal offerings!</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl overflow-hidden shadow-lg p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Seasonal Specials</h2>
          </div>
        </div>
      </div>
      {/* Specials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeSpecials.map((special) => {
          const product = products.find(p => p.id === special.id);
          return (
            <div key={special.id} className="flex items-center bg-white rounded-lg shadow-md p-6">
              <button
                className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ cursor: onProductClick ? 'pointer' : 'default' }}
                onClick={() => onProductClick && product && onProductClick(product.id)}
                tabIndex={0}
                aria-label={`View details for ${special.name}`}
                onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && onProductClick && product) onProductClick(product.id); }}
              >
                <img
                  src={special.image}
                  alt={special.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/1414234/pexels-photo-1414234.jpeg';
                }}
              />
              </button>
            <div className="ml-6 flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{special.name}</h3>
                  {special.badge && (
                      <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                      {special.badge}
                      </span>
                    )}
                  </div>
                <p className="text-gray-600 mb-3 line-clamp-2">{special.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-amber-600">{formatUGX(special.price)}</span>
                    <div className="text-sm text-gray-500">
                    Until {new Date(special.endDate).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold mt-2"
                  onClick={() => product && dispatch({ type: 'ADD_TO_CART', payload: product })}
                  disabled={!product}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Footer with time remaining */}
      <div className="bg-white/50 px-6 py-3 border-t border-amber-200 mt-6 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {activeSpecials.length} seasonal special{activeSpecials.length !== 1 ? 's' : ''} available
          </span>
          <div className="flex items-center space-x-1 text-amber-600">
            <Clock className="w-4 h-4" />
            <span>Limited time only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalSpecialsCarousel;