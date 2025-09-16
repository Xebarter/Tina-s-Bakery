// This script is used by Vercel to build the application
const { execSync } = require('child_process');

console.log('Starting Vercel build process...');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the frontend
console.log('Building frontend...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Build completed successfully!');
