import { useEffect } from 'react';
import { Minus, Plus, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatUGX } from '../utils/currency';
import { Product } from '../types';

// Extended type to handle potential image URL variations
type ProductWithImages = Product & {
  image_url?: string;
  image?: string;
  url?: string;
  images?: string[];
  designInspirationImage?: string; // For custom cakes
};

interface CartPageProps {
  onViewChange: (view: string) => void;
}

export function CartPage({ onViewChange }: CartPageProps) {
  const { state, dispatch } = useApp();

  // Debug log to inspect cart items
  useEffect(() => {
    console.log('Cart items:', state.cart);
    if (state.cart.length > 0) {
      console.log('First cart item:', state.cart[0]);
      console.log('First cart item product:', state.cart[0]?.product);
      console.log('All product properties:', Object.keys(state.cart[0]?.product || {}));
      console.log('First cart item image URL:', state.cart[0]?.product?.imageUrl);

      // Log the first product's full structure
      const firstProduct = state.cart[0]?.product;
      if (firstProduct) {
        console.log('First product full structure:', JSON.stringify(firstProduct, null, 2));
      }
    }
  }, [state.cart]);

  const subtotal = state.cart.reduce((sum, item) => {
    if (!item.product) {
      console.error('Cart item with missing product:', item);
      return sum;
    }
    return sum + (item.product.price * item.quantity);
  }, 0);
  const tax = subtotal * 0.18; // 18% VAT in Uganda
  const total = subtotal + tax;

  const updateQuantity = (productId: string, quantity: number) => {
    console.log('Updating quantity:', { productId, quantity });
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { id: productId, quantity } });
    }
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const proceedToCheckout = () => {
    // Navigate to payment page
    onViewChange('payment');
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any delicious items to your cart yet.
            </p>
            <button
              onClick={() => onViewChange('menu')}
              className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-2">{state.cart.length} {state.cart.length === 1 ? 'item' : 'items'}</p>
          </div>
          <button
            onClick={() => onViewChange('menu')}
            className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {state.cart.filter(item => item.product).map((item, idx) => (
                <div key={item.product?.id ? `${item.product.id}-${idx}` : idx} className="p-6 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      {(() => {
                        const product = item.product as ProductWithImages;
                        if (!product) {
                          console.log('Product is missing for item:', item);
                          return (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          );
                        }

                        // For custom cakes, prioritize design inspiration image
                        if (product.categoryId === 'custom-cake' || (product as any).category_id === 'custom-cake') {
                          // Check for designImage in the product or in the cart item
                          const designImage = (product as any).designImage || (product as any).image;
                          if (designImage) {
                            console.log('Loading design inspiration image:', designImage);
                            return (
                              <div className="relative w-full h-full">
                                <img
                                  src={designImage}
                                  alt="Custom cake design inspiration"
                                  className="w-full h-full object-cover rounded-md"
                                  onError={(e) => {
                                    console.error('Failed to load design inspiration image:', designImage, e);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = '/placeholder-cake.jpg';
                                  }}
                                  onLoad={() => console.log('Successfully loaded design inspiration image')}
                                />
                                <span className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                  const designImage = (product as any).designImage || (product as any).image || (product as any).image_url;
                                </span>
                              </div>
                            );
                          } else {
                            console.log('No design inspiration image found for custom cake:', product);
                          }
                        }

                        // For regular products, try different possible image URL properties
                        const possibleImageSources = [
                          product.image,  // This is where the actual image URL is stored
                          (product as any).image_url,
                          product.imageUrl,
                          (product as any).url,
                          ...((product as any).images || [])
                        ].filter(Boolean);

                        // Get the first valid image URL
                        const imageUrl = possibleImageSources[0];

                        if (!imageUrl) {
                          console.log('No image URL found in product. Available properties:', Object.entries(product));
                          return (
                            <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          );
                        }

                        // Handle both full URLs and relative paths
                        let finalImageUrl = imageUrl;
                        
                        // If it's not a full URL, try to construct one from Supabase
                        if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
                          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                          if (supabaseUrl) {
                            // Remove any leading slashes from the image path
                            const cleanPath = imageUrl.replace(/^\/+/, '');
                            finalImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${cleanPath}`;
                          }
                        }
                        
                        return (
                          <img
                            src={finalImageUrl}
                            alt={product.name || 'Product image'}
                            className="w-full h-full object-cover rounded-md"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/images/placeholder-product.jpg';
                            }}
                            onLoad={() => console.log('Successfully loaded product image')}
                          />
                        );
                      })()}
                      {item.quantity > 1 && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                      {item.product.description && (
                        <p className="text-gray-600 text-sm">{item.product.description.substring(0, 60)}...</p>
                      )}
                      {item.product.categoryId === 'custom-cake' && (
                        <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Deposit</span>
                      )}
                      <p className="text-amber-600 font-semibold">{formatUGX(item.product.price)} each</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.productId || item.product?.id, item.quantity - 1);
                        }}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.productId || item.product?.id, item.quantity + 1);
                        }}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {formatUGX(item.product.price * item.quantity)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.productId || item.product?.id);
                        }}
                        className="text-red-600 hover:text-red-800 mt-2"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatUGX(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VAT (18%)</span>
                  <span className="font-medium">{formatUGX(tax)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-semibold text-amber-600">{formatUGX(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Proceed to Checkout
              </button>

              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Secure checkout with SSL encryption</p>
              </div>
            </div>

            {/* Pickup Information */}
            <div className="bg-amber-50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-amber-800 mb-2">Pickup Information</h4>
              <p className="text-amber-700 text-sm">
                Orders typically ready within 2-4 hours. We'll notify you when your order is ready for pickup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}