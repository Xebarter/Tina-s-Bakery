// This script is used by Vercel to build the application (CommonJS version)
const { execSync } = require('child_process');

console.log('Starting Vercel build process (CommonJS)...');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the frontend
console.log('Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('Frontend build completed successfully!');
} catch (error) {
  console.error('Error during frontend build:', error);
  process.exit(1);
}

// Build the server
console.log('Building server...');
try {
  execSync('npm run build:server', { stdio: 'inherit' });
  console.log('Server build completed successfully!');
} catch (error) {
  console.error('Error building server:', error);
  process.exit(1);
}

console.log('Build completed successfully!');
