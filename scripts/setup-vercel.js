const fs = require('fs');
const path = require('path');

// Ensure .vercel/output directory exists
const outputDir = path.join(__dirname, '..', '.vercel', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create config.json
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/api/(.*)', dest: '/api' },
    { src: '/pesapal/(.*)', dest: '/api/pesapal/$1' },
    { src: '/(.*)', dest: '/index.html' }
  ]
};

fs.writeFileSync(
  path.join(outputDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('✅ Created Vercel config.json');

// Create static directory for Vercel
const staticDir = path.join(outputDir, 'static');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

console.log('✅ Vercel setup complete');
