const fs = require('fs');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');

// Define your site URL
const siteUrl = 'https://tinasbakery.com';

// Define your pages
const pages = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/menu', changefreq: 'weekly', priority: 0.9 },
  { url: '/about', changefreq: 'monthly', priority: 0.8 },
  { url: '/contact', changefreq: 'monthly', priority: 0.8 },
  { url: '/custom-cakes', changefreq: 'weekly', priority: 0.9 },
  { url: '/order-tracking', changefreq: 'weekly', priority: 0.7 },
];

// Create sitemap
async function generateSitemap() {
  const sitemap = new SitemapStream({
    hostname: siteUrl,
    cacheTime: 600000, // 600 sec - cache purge period
  });

  const writeStream = fs.createWriteStream(path.resolve('./public/sitemap.xml'));
  sitemap.pipe(writeStream);

  // Add all pages to sitemap
  pages.forEach(page => {
    sitemap.write(page);
  });

  sitemap.end();
  
  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(console.error);
