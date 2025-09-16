// This script is used by Vercel to build the application
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

console.log('🚀 Starting Vercel build process...');

// Ensure output directory exists
const outputDir = join(process.cwd(), '.vercel', 'output');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
  console.log('✅ Created .vercel/output directory');
}

// Create static directory
const staticDir = join(outputDir, 'static');
if (!existsSync(staticDir)) {
  mkdirSync(staticDir, { recursive: true });
  console.log('✅ Created static directory');
}

// Create config.json
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
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

writeFileSync(
  join(outputDir, 'config.json'),
  JSON.stringify(config, null, 2)
);
console.log('✅ Created Vercel config.json');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!');
} catch (error) {
  console.error('❌ Error installing dependencies:', error);
  process.exit(1);
}

// Build the frontend
console.log('🏗️  Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build completed successfully!');
} catch (error) {
  console.error('❌ Error during frontend build:', error);
  process.exit(1);
}

// Build the server
console.log('⚙️  Building server...');
try {
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('✅ Server build completed successfully!');
} catch (error) {
  console.error('❌ Error building server:', error);
  process.exit(1);
}

console.log('✨ Build completed successfully!');
