const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel deployment process...');

// Ensure .vercel/output directory exists
const outputDir = path.join(__dirname, '.vercel', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('📁 Created .vercel/output directory');
}

// Create config.json for Vercel
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

// Run the build process
console.log('🔨 Building the application...');
try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the frontend
  console.log('🏗️  Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Build the server
  console.log('⚙️  Building server...');
  execSync('npm run build:server', { stdio: 'inherit' });

  console.log('✨ Build completed successfully!');
  console.log('🚀 Ready for deployment! Run: vercel --prod');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
