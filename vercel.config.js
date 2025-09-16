module.exports = {
  version: 2,
  build: {
    env: {
      NODE_ENV: 'production'
    }
  },
  builds: [
    {
      src: 'package.json',
      use: '@vercel/static-build',
      config: {
        distDir: 'dist'
      }
    },
    {
      src: 'server/index.js',
      use: '@vercel/node'
    }
  ],
  routes: [
    { src: '/api/(.*)', dest: '/api' },
    { src: '/pesapal/(.*)', dest: '/api/pesapal/$1' },
    { 
      src: '/(.*)', 
      dest: '/index.html',
      headers: {
        'Cache-Control': 's-maxage=0, stale-while-revalidate=60'
      }
    }
  ]
};
