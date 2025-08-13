import React from 'react';
import { Clock, MapPin, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatUGX } from '../utils/currency';
import { HeroCarouselManager } from './HeroCarouselManager';
import { SeasonalSpecialsCarousel } from './SeasonalSpecialsCarousel';
import { ProductDetailModal } from './ProductDetailModal';
import { SEO } from './SEO';

interface HomePageProps {
  onViewChange: (view: string) => void;
}

export function HomePage({ onViewChange }: HomePageProps) {
  const { state, dispatch } = useApp();
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [showProductModal, setShowProductModal] = React.useState(false);

  const signatureProducts = state.products.filter(p => p.isSignatureProduct);
  const seasonalProducts = state.products.filter(p => p.isSeasonalSpecial);

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
    <>
      <SEO 
        title="Artisanal Baked Goods & Custom Cakes in Uganda & UAE"
        description="Discover Tina's Bakery - Handcrafted artisanal bread, pastries, and custom cakes made with love in Uganda & UAE. Fresh, delicious, and perfect for any occasion."
      />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* ============= LUXE FULL-VIEWPORT HERO ============= */}
      <header
        className="relative h-screen min-h-[100svh] min-h-[100dvh] overflow-hidden"
        style={{ minHeight: '100svh' }}
        aria-label="Luxury hero section"
      >
        {/* Hero media / carousel (keeps original functionality) */}
        <div className="absolute inset-0">
          <HeroCarouselManager onViewChange={onViewChange} />
        </div>

        {/* Premium vignette + gradient overlays */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/20 to-amber-900/30" />
          <div className="absolute inset-0 [box-shadow:inset_0_0_180px_60px_rgba(0,0,0,0.45)]" />
        </div>

        {/* Ambient glow orbs (reduced on prefers-reduced-motion) */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-24 left-16 w-40 h-40 rounded-full blur-3xl bg-amber-400/20 motion-safe:animate-pulse" />
          <div className="absolute bottom-24 right-24 w-56 h-56 rounded-full blur-3xl bg-yellow-300/10 motion-safe:animate-pulse [animation-delay:800ms]" />
        </div>

      
        {/* Hero content CTA band (keeps full viewport prominence) */}
        <div className="relative z-20 flex h-full min-h-[inherit] items-end">
          <div className="mx-auto mb-24 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white/90 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Always Fresh • Always Delicious
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
                Welcome to
                <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent"> Tina's Bakery</span>
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
                
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onViewChange('menu')}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-3 text-white shadow-lg transition hover:from-amber-700 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  Explore Menu
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <button
                  onClick={() => onViewChange('contact')}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-white/90 backdrop-blur transition hover:text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 text-center">
          <div className="mx-auto grid place-items-center opacity-90">
            <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/70">
              <div className="mt-2 h-3 w-1 rounded-full bg-white/80 motion-safe:animate-pulse" />
            </div>
            <p className="mt-2 text-xs tracking-widest text-white/70">SCROLL</p>
          </div>
        </div>
      </header>

      {/* ============= SIGNATURE COLLECTION ============= */}
      <section
        aria-labelledby="signature-heading"
        className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-24"
      >
        {/* Divider shimmer */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400" />
              <Sparkles className="h-6 w-6 text-amber-600" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400" />
            </div>
            <h2
              id="signature-heading"
              className="mb-4 bg-gradient-to-r from-slate-800 via-slate-700 to-amber-700 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl"
            >
              Signature Collection
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Handcrafted with love, our signature items are customer favorites. Each creation is made with the finest ingredients and baked to perfection.
            </p>
          </div>

          {/* Product grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {signatureProducts.slice(0, 4).map((product, index) => (
              <article
                key={product.id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl focus-within:ring-2 focus-within:ring-amber-400"
                onClick={() => handleProductClick(product.id)}
                tabIndex={0}
                aria-label={`View details for ${product.name}`}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleProductClick(product.id);
                }}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card bg hover glaze */}
                <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-white to-slate-50" />

                {/* Media */}
                <div className="relative">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 p-3 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <div className="absolute inset-0 -skew-x-12 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                  </div>

                  {/* Content */}
                  <div className="container mx-auto px-4 py-12">
                    <header className="text-center mb-12">
                      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                    </header>
                    <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {product.description}
                    </p>

                    <div className="mb-5 flex items-center justify-between">
                      <span className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-2xl font-bold text-transparent">
                        {formatUGX(product.price)}
                      </span>
                      <div className="flex text-amber-400" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>

                    <button
                      className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:from-amber-700 hover:to-amber-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                      onClick={e => {
                        e.stopPropagation();
                        dispatch({ type: 'ADD_TO_CART', payload: product });
                      }}
                    >
                      <span className="relative z-10">Add to Cart</span>
                      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100 bg-gradient-to-r from-white/20 to-transparent" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============= SEASONAL SPECIALS ============= */}
      <section
        aria-labelledby="specials-heading"
        className="bg-gradient-to-br from-slate-900 to-slate-950 py-16"
      >
        <h2 id="specials-heading" className="sr-only">
          Seasonal Specials
        </h2>
        <SeasonalSpecialsCarousel
          specials={seasonalSpecials}
          products={seasonalProducts}
          onProductClick={handleProductClick}
        />
      </section>

      {/* ============= BUSINESS INFO ============= */}
      <section
        aria-labelledby="info-heading"
        className="relative bg-gradient-to-br from-slate-50 via-white to-amber-50 py-24"
      >
        {/* Soft patterned background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(148,163,184,0.12),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="info-heading" className="sr-only">
            Location, Hours, and Newsletter
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {/* Hours Card */}
            <div className="group rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:bg-white/90">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 blur-lg opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
                <Clock className="relative mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-amber-600 shadow-lg" />
              </div>
              <h3 className="mb-6 text-2xl font-bold tracking-tight text-slate-800">Business Hours</h3>
              <div className="space-y-3 text-slate-700">
                {[
                  { day: 'Monday - Friday', time: '6:00 AM - 8:00 PM' },
                  { day: 'Saturday', time: '6:00 AM - 9:00 PM' },
                  { day: 'Sunday', time: '7:00 AM - 6:00 PM' },
                ].map((schedule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg px-4 py-2 transition-colors duration-200 hover:bg-amber-50"
                  >
                    <span className="font-medium">{schedule.day}</span>
                    <span className="font-semibold text-amber-700">{schedule.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Card */}
            <div className="group rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:bg-white/90">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 blur-lg opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
                <MapPin className="relative mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-amber-600 shadow-lg" />
              </div>
              <h3 className="mb-6 text-2xl font-bold tracking-tight text-slate-800">Visit Us</h3>
              <address className="space-y-1 not-italic text-slate-700">
                <p className="text-lg font-medium">123 Main Street</p>
                <p>Downtown District</p>
                <p>City, ST 12345</p>
                <p className="mt-4 text-lg font-bold text-amber-700">(555) 123-4567</p>
              </address>
            </div>

            {/* Newsletter Card */}
            <div className="group rounded-2xl border border-white/60 bg-gradient-to-br from-white/85 to-amber-50/80 p-8 shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-2xl hover:from-white/90 hover:to-amber-50/90">
              <div className="mb-6 text-center">
                <div className="relative mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 blur-lg opacity-30 transition-opacity duration-300 group-hover:opacity-50" />
                  <Sparkles className="relative mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-amber-600 shadow-lg" />
                </div>
                <h3 className="mb-3 text-2xl font-bold tracking-tight text-slate-800">Stay Updated</h3>
                <p className="mx-auto max-w-sm text-base leading-relaxed text-slate-600">
                  Get exclusive access to new products, special offers, and insider news!
                </p>
              </div>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  // hook into your newsletter action here if available
                }}
                aria-label="Newsletter subscription"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-6 py-4 text-slate-700 placeholder-slate-400 outline-none transition-all duration-300 backdrop-blur-sm focus:border-transparent focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:from-amber-700 hover:to-amber-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <span className="relative z-10 inline-flex items-center justify-center gap-2">
                    <span>Subscribe Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-white/20 to-transparent" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Product Detail Modal (preserves existing behavior) */}
      <ProductDetailModal
        isOpen={showProductModal && !!selectedProductId}
        onClose={handleCloseModal}
        productId={selectedProductId || ''}
      />
      </main>
    </>
  );
}
