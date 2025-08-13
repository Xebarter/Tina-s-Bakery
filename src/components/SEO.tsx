import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

type SEOProps = {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
};

export const SEO: React.FC<SEOProps> = ({
  title = "Tina's Bakery | Artisanal Baked Goods in Uganda & UAE",
  description = "Handcrafted artisanal baked goods made with love in Uganda & UAE. Fresh bread, pastries, cakes, and custom orders for all occasions.",
  image = "/images/og-image.jpg",
  article = false,
}) => {
  const { pathname } = useLocation();
  const url = `https://tinasbakery.com${pathname}`;
  const siteName = "Tina's Bakery";
  const twitterHandle = "@tinasbakery";

  return (
    <Helmet
      title={title}
      titleTemplate={`%s | ${siteName}`}
      defaultTitle={siteName}
    >
      <html lang="en" />
      <meta name="description" content={description} />
      <meta name="image" content={image} />

      {/* Open Graph / Facebook */}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical URL */}
      <link rel="canonical" href={url} />

      {/* Additional meta tags */}
      <meta name="robots" content="index, follow" />
      <meta name="theme-color" content="#b45309" />
      
      {/* Preload critical resources */}
      <link rel="preload" href="/fonts/your-font.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      
      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: siteName,
          url: 'https://tinasbakery.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://tinasbakery.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
