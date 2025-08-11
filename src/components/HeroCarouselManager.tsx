import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Play, Pause, Eye, Calendar } from 'lucide-react';
import { ImageUpload } from './ImageUpload';
import { ImageFile } from '../utils/imageUtils';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

interface CarouselSlide {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  ctaText?: string;
  ctaLink?: string;
  duration: number; // in seconds
  isActive: boolean;
  order: number;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

interface HeroCarouselManagerProps {
  isAdmin?: boolean;
  onViewChange?: (view: string) => void;
}

export function HeroCarouselManager({ isAdmin = false, onViewChange }: HeroCarouselManagerProps) {
  const { state } = useApp();
  const navigate = useNavigate();

  // Filter featured products for hero carousel
  const featuredProducts = state.products.filter(
    (product) => product.featured
  );

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-advance carousel
  useEffect(() => {
    if (!isPlaying || featuredProducts.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide, isPlaying, featuredProducts.length]);

  // Get all product images for the background carousel
  const productImages = state.products.map(p => p.image).filter(Boolean);
  const [bgIndex, setBgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  // Smooth fade transition for background images
  useEffect(() => {
    if (productImages.length === 0) return;
    setFade(false);
    const fadeOut = setTimeout(() => setFade(true), 100); // quick fade out
    const timer = setTimeout(() => {
      setBgIndex((prev) => (prev + 1) % productImages.length);
    }, 5000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fadeOut);
    };
  }, [bgIndex, productImages.length]);

  // Preload next image for smoothness
  useEffect(() => {
    if (productImages.length > 1) {
      const nextIdx = (bgIndex + 1) % productImages.length;
      const img = new window.Image();
      img.src = productImages[nextIdx];
    }
  }, [bgIndex, productImages]);

  // Fallback if no images
  if (productImages.length === 0) {
    return (
      <section className="relative w-full bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch min-h-[28rem] md:min-h-[32rem] lg:min-h-[36rem]">
          <div className="relative flex-1 min-h-[18rem] md:min-h-0 flex items-center justify-center">
            <img
              src="https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg"
              alt="Bakery Default Hero"
              className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out z-0"
              style={{ filter: 'brightness(0.7)' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
            <div className="relative z-20 flex flex-col justify-center h-full px-6 py-12 md:px-12 text-white text-center w-full">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">Welcome to Tina’s Bakery</h1>
              <p className="text-lg md:text-2xl font-medium mb-2 drop-shadow">Always Fresh</p>
              <p className="text-base md:text-lg mb-6 max-w-xl mx-auto drop-shadow">
                Freshly baked with love! From classic loaves to seasonal treats, Tina’s Bakery serves up deliciousness made with the finest ingredients—always fresh, always delightful
              </p>
                <button
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors text-lg mx-auto"
                onClick={() => navigate('/menu')}
              >
                Order Now
                </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Main hero section with smooth-fading background carousel
  return (
    <section className="relative w-full bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch min-h-[28rem] md:min-h-[32rem] lg:min-h-[36rem]">
        <div className="relative flex-1 min-h-[18rem] md:min-h-0 flex items-center justify-center">
          {/* Background image with fade transition */}
          <img
            src={productImages[bgIndex]}
            alt="Bakery Product"
            className={`absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-1000 ${fade ? 'opacity-100' : 'opacity-0'}`}
            style={{ filter: 'brightness(0.7)' }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
          {/* Overlay text and button */}
          <div className="relative z-20 flex flex-col justify-center h-full px-6 py-12 md:px-12 text-white text-center w-full">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">
              Welcome to <span className="text-amber-600">Tina’s Bakery</span>
                </h1>
            <p className="text-lg md:text-2xl font-medium mb-2 drop-shadow italic">Always Fresh</p>
            <p className="text-base md:text-lg mb-6 max-w-xl mx-auto drop-shadow">
              Freshly baked with love! From classic loaves to seasonal treats, Tina’s Bakery serves up deliciousness made with the finest ingredients—always fresh, always delightful
            </p>
            <button
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-colors text-lg mx-auto"
              onClick={() => onViewChange ? onViewChange('menu') : undefined}
            >
              Order Now
            </button>
          </div>
        </div>
    </div>
    </section>
  );
}