import React, { useState } from 'react';
import { Calendar, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CakeOrder, CartItem } from '../types';
import { uploadDesignImage } from '../services/supabase';

interface CustomCakePageProps {
  onViewChange: (view: string) => void;
}

export function CustomCakePage({ onViewChange }: CustomCakePageProps) {
  const { state, dispatch } = useApp();
  const [formData, setFormData] = useState({
    cakeType: '',
    size: '',
    flavor: '',
    frosting: '',
    decorations: [] as string[],
    customText: '',
    neededBy: '',
    notes: '',
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const [designImage, setDesignImage] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const cakeTypes = [
    { id: 'birthday', name: 'Birthday Cake' },
    { id: 'wedding', name: 'Wedding Cake' },
    { id: 'anniversary', name: 'Anniversary Cake' },
    { id: 'graduation', name: 'Graduation Cake' },
    { id: 'baby-shower', name: 'Baby Shower Cake' },
    { id: 'custom', name: 'Custom Design' }
  ];

  const sizes = [
    { id: 'small', name: '6" Round (Serves 8-10)', multiplier: 1 },
    { id: 'medium', name: '8" Round (Serves 12-15)', multiplier: 1.5 },
    { id: 'large', name: '10" Round (Serves 20-25)', multiplier: 2 },
    { id: '2-tier', name: '2-Tier (Serves 30-35)', multiplier: 2.5 },
    { id: '3-tier', name: '3-Tier (Serves 50-60)', multiplier: 3.5 }
  ];

  const flavors = [
    'Vanilla', 'Chocolate', 'Red Velvet', 'Lemon', 'Strawberry', 
    'Carrot', 'Funfetti', 'Coconut', 'Marble', 'Chocolate Chip'
  ];

  const frostings = [
    'Buttercream', 'Cream Cheese', 'Chocolate Ganache', 
    'Fondant', 'Whipped Cream', 'Caramel'
  ];

  const decorationOptions = [
    'Fresh Flowers', 'Sugar Flowers', 'Piped Roses', 'Pearl Details',
    'Gold Accents', 'Chocolate Drip', 'Fresh Fruit', 'Sprinkles',
    'Custom Figurines', 'Photo Print'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomerInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, [field]: value }
    }));
  };

  const handleDecorationToggle = (decoration: string) => {
    setFormData(prev => ({
      ...prev,
      decorations: prev.decorations.includes(decoration)
        ? prev.decorations.filter(d => d !== decoration)
        : [...prev.decorations, decoration]
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    
    try {
      // First show a preview of the selected image
      const previewUrl = URL.createObjectURL(file);
      setDesignImage(previewUrl);
      
      // Upload the image to Supabase
      const imageUrl = await uploadDesignImage(file);
      setDesignImage(imageUrl);
      console.log('Design image uploaded successfully:', imageUrl);
    } catch (error) {
      console.error('Error uploading design image:', error);
      setUploadError('Failed to upload design image. Please try again.');
      setDesignImage('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date().toISOString();
    const newCakeOrder: CakeOrder = {
      id: `cake-order-${Date.now()}`,
      userId: state.currentUser?.id || 'guest',
      customerId: state.currentUser?.id || 'guest',
      cakeType: formData.cakeType,
      size: formData.size,
      flavor: formData.flavor,
      frosting: formData.frosting,
      decorations: formData.decorations,
      customText: formData.customText,
      designImage,
      neededBy: formData.neededBy,
      status: 'quote',
      notes: formData.notes,
      pickupDate: formData.neededBy || now,
      price: 50000, // Base price, can be adjusted based on size, etc.
      createdAt: now,
      updatedAt: now,
      // Add required fields with defaults
      message: formData.customText || '',
      specialInstructions: formData.notes || ''
    };
    
    dispatch({ type: 'ADD_CAKE_ORDER', payload: newCakeOrder });
    
    // Add to cart as a regular item
    const cartItem: CartItem = {
      id: newCakeOrder.id,
      quantity: 1,
      price: 50000,
      name: `${newCakeOrder.cakeType} (${newCakeOrder.size})`,
      imageUrl: newCakeOrder.designImage || '',
      product: {
        id: newCakeOrder.id,
        name: `${newCakeOrder.cakeType} (${newCakeOrder.size})`,
        description: `${newCakeOrder.flavor} with ${newCakeOrder.frosting} frosting${newCakeOrder.decorations?.length ? ', decorations: ' + newCakeOrder.decorations.join(', ') : ''}${newCakeOrder.customText ? ', custom text: ' + newCakeOrder.customText : ''}`,
        price: 50000,
        category_id: 'custom-cake',
        image: newCakeOrder.designImage || '',
        inStock: true,
        inventory: 1,
        isFeatured: false,
        isAvailable: true,
        slug: `custom-cake-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        isSeasonalSpecial: false,
        isSignatureProduct: false,
        display_settings: null,
        categoryId: 'custom-cake'
      }
    };
    
    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Submitted!</h1>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-green-800 font-semibold">
            Please make a deposit of <span className="font-bold">UGX 50,000</span>. This amount will be deducted from the total price of your cake.
          </div>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for your custom cake order. We'll review your requirements and 
            contact you within 24 hours with a detailed quote and timeline.
          </p>
          <button
            onClick={() => onViewChange('cart')}
            className="bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            Go to Cart & Pay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Custom Cake Orders</h1>
          <p className="text-xl text-gray-600">
            Create the perfect cake for your special occasion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Cake Type */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cake Type</h3>
                <div className="grid grid-cols-2 gap-3">
                  {cakeTypes.map((type) => (
                    <label key={type.id} className="relative">
                      <input
                        type="radio"
                        name="cakeType"
                        value={type.id}
                        onChange={(e) => handleInputChange('cakeType', e.target.value)}
                        className="sr-only"
                        required
                      />
                      <div className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.cakeType === type.id
                          ? 'border-amber-600 bg-amber-50'
                          : 'border-gray-300 hover:border-amber-300'
                      }`}>
                        <p className="font-medium text-sm">{type.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Design Upload */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Inspiration</h3>
                <div className="mt-2 flex flex-col items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  {designImage ? (
                    <div className="relative w-full max-w-xs">
                      <img 
                        src={designImage} 
                        alt="Design inspiration preview" 
                        className="w-full h-auto rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => setDesignImage('')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={isUploading}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="design-upload"
                          className={`relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>Upload a file</span>
                          <input
                            id="design-upload"
                            name="design-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                  {isUploading && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Uploading your design...
                    </div>
                  )}
                  {uploadError && (
                    <p className="mt-2 text-sm text-red-600">{uploadError}</p>
                  )}
                </div>
              </div>

              {/* Size */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Size</h3>
                <div className="space-y-2">
                  {sizes.map((size) => (
                    <label key={size.id} className="flex items-center">
                      <input
                        type="radio"
                        name="size"
                        value={size.id}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                        required
                      />
                      <span className="ml-3 text-sm">{size.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Flavor & Frosting */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flavor & Frosting</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cake Flavor</label>
                    <select
                      value={formData.flavor}
                      onChange={(e) => handleInputChange('flavor', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Select flavor</option>
                      {flavors.map((flavor) => (
                        <option key={flavor} value={flavor}>{flavor}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frosting Type</label>
                    <select
                      value={formData.frosting}
                      onChange={(e) => handleInputChange('frosting', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    >
                      <option value="">Select frosting</option>
                      {frostings.map((frosting) => (
                        <option key={frosting} value={frosting}>{frosting}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Decorations */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Decorations</h3>
                <div className="grid grid-cols-2 gap-2">
                  {decorationOptions.map((decoration) => (
                    <label key={decoration} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.decorations.includes(decoration)}
                        onChange={() => handleDecorationToggle(decoration)}
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm">{decoration}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Text */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Text</h3>
                <input
                  type="text"
                  value={formData.customText}
                  onChange={(e) => handleInputChange('customText', e.target.value)}
                  placeholder="Happy Birthday, Congratulations, etc."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Design Upload */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Inspiration</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="design-upload"
                  />
                  <label htmlFor="design-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Upload a reference image (optional)
                    </span>
                  </label>
                  {designImage && (
                    <div className="mt-4">
                      <img src={designImage} alt="Design preview" className="max-w-full h-32 object-cover rounded-md mx-auto" />
                    </div>
                  )}
                </div>
              </div>

              {/* Date Needed */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">When do you need this?</h3>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.neededBy}
                    onChange={(e) => handleInputChange('neededBy', e.target.value)}
                    min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Custom cakes require minimum 7 days notice
                </p>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any special requests, dietary restrictions, or additional details..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.customerInfo.name}
                  onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.customerInfo.email}
                  onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="bg-amber-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors"
            >
              Submit Order Request
            </button>
            <p className="text-sm text-gray-600 mt-4">
              We'll review your order and contact you within 24 hours with a detailed quote
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}