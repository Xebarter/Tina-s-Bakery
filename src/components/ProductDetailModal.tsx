import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, Mail } from 'lucide-react';
import { fetchProductById } from '../services/supabase';
import { useApp } from '../contexts/AppContext';
import type { Product } from '../types';
import { formatUGX } from '../utils/currency';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  product?: Product;
  mode?: 'add-to-cart' | 'contact';
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  productId,
  product: initialProduct,
  mode = 'add-to-cart',
}) => {
  const { dispatch } = useApp();
  const [product, setProduct] = useState<Product | null>(initialProduct || null);
  const [loading, setLoading] = useState(!initialProduct);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialProduct && isOpen) {
      setLoading(true);
      fetchProductById(productId).then((data) => {
        setProduct(data);
        setLoading(false);
      });
    } else if (initialProduct) {
      setProduct(initialProduct);
      setLoading(false);
    }
  }, [productId, initialProduct, isOpen]);

  // Close on Esc
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="Close product details"
        >
          <X className="h-6 w-6" />
        </button>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600" />
          </div>
        ) : product ? (
          <div className="p-6">
            <div className="flex flex-col items-center">
              <img
                src={product.image}
                alt={product.name}
                className="w-40 h-40 object-cover rounded-lg mb-4 border"
              />
              <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{product.name}</h2>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl font-bold text-amber-600">{formatUGX(product.price)}</span>
                {product.featured && (
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">Featured</span>
                )}
                {product.isSignatureProduct && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Signature</span>
                )}
                {product.isSeasonalSpecial && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Seasonal</span>
                )}
                {product.display_settings?.badges?.map((badge) => (
                  <span key={badge} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">{badge}</span>
                ))}
              </div>
              <p className="text-gray-700 text-center mb-4">{product.description}</p>
              <div className="flex items-center justify-center mb-4">
                <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>{product.inStock ? `${product.inventory} in stock` : 'Out of stock'}</span>
              </div>
              {mode === 'add-to-cart' ? (
                <button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-semibold mt-2"
                  onClick={() => dispatch({ type: 'ADD_TO_CART', payload: { id: product.id, product: product, quantity: 1, price: product.price, name: product.name, imageUrl: product.image } })}
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="inline-block mr-2 h-5 w-5" /> Add to Cart
                </button>
              ) : (
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold mt-2"
                  onClick={() => window.location.href = `mailto:info@tinasbakery.com?subject=Inquiry about ${encodeURIComponent(product.name)}`}
                >
                  <Mail className="inline-block mr-2 h-5 w-5" /> Contact Seller
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <span className="text-gray-500">Product not found.</span>
          </div>
        )}
      </div>
    </div>
  );
};