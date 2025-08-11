import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Product } from '../types';
import { formatUGX } from '../utils/currency';
import { ProductDetailModal } from './ProductDetailModal';

interface MenuPageProps {
  onViewChange: (view: string) => void;
}

export function MenuPage({ onViewChange }: MenuPageProps) {
  const { state, dispatch } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const categories = [
    { id: 'all', name: 'All Items' },
    ...state.categories
  ];

  let filteredProducts = state.products;
  if (selectedCategory !== 'all') {
    if (selectedCategory === 'seasonal') {
      filteredProducts = state.products.filter(product => product.isSeasonalSpecial);
    } else {
      filteredProducts = state.products.filter(product => product.category_id === selectedCategory);
    }
  }

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const updateQuantity = (productId: string, change: number) => {
    const newQuantity = Math.max(1, getQuantity(productId) + change);
    setQuantities(prev => ({ ...prev, [productId]: newQuantity }));
  };

  const addToCart = (product: Product) => {
    const quantity = getQuantity(product.id);
    for (let i = 0; i < quantity; i++) {
      dispatch({ type: 'ADD_TO_CART', payload: product });
    }
    // Reset quantity after adding to cart
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const handleProductClick = (id: string) => {
    setSelectedProductId(id);
    setShowProductModal(true);
  };
  const handleCloseModal = () => {
    setShowProductModal(false);
    setSelectedProductId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600">
            Fresh baked goods made daily with the finest ingredients
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
          {/* Special case for seasonal filter if not already in categories */}
          {!state.categories.some(cat => cat.name.toLowerCase() === 'seasonal') && (
            <button
              key="seasonal"
              onClick={() => setSelectedCategory('seasonal')}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === 'seasonal'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-300'
              }`}
            >
              Seasonal
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleProductClick(product.id)}
              tabIndex={0}
              role="button"
              aria-label={`View details for ${product.name}`}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleProductClick(product.id); }}
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-xs text-gray-500">
                      {state.categories.find(cat => cat.id === product.category_id)?.name || ''}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-amber-600">{formatUGX(product.price)}</span>
                </div>
                
                <p className="text-gray-600 mb-4 text-sm">{product.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${
                    product.inStock ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {product.inStock ? `${product.inventory} in stock` : 'Out of stock'}
                  </span>
                  
                  {product.featured && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                </div>

                {product.inStock && (
                  <div className="space-y-3">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-center space-x-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={getQuantity(product.id) <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{getQuantity(product.id)}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        disabled={getQuantity(product.id) >= product.inventory}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={e => { e.stopPropagation(); addToCart(product); }}
                      className="w-full bg-amber-600 text-white py-2 rounded-md font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </button>
                  </div>
                )}

                {!product.inStock && (
                  <button
                    disabled
                    className="w-full bg-gray-300 text-gray-500 py-2 rounded-md font-semibold cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {selectedCategory === 'seasonal'
                ? 'No seasonal specials available at the moment.'
                : 'No products found in this category.'}
            </p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-amber-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Need Something Special?
            </h3>
            <p className="text-gray-600 mb-6">
              We create custom cakes and catering for special occasions
            </p>
            <button
              onClick={() => onViewChange('custom-cakes')}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              Order Custom Cake
            </button>
          </div>
        </div>
      </div>
      <ProductDetailModal
        isOpen={showProductModal && !!selectedProductId}
        onClose={handleCloseModal}
        productId={selectedProductId || ''}
      />
    </div>
  );
}