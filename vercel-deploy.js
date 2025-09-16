const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Vercel deployment...');

// Ensure .vercel/output directory exists
const outputDir = path.join(__dirname, '.vercel', 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create or update config.json
const config = {
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/api/(.*)', 'dest': '/api' },
    { src: '/pesapal/(.*)', 'dest': '/api/pesapal/$1' },
    { src: '/(.*)', 'dest': '/index.html' }
  ]
};

fs.writeFileSync(
  path.join(outputDir, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('Vercel configuration generated');

// Run the build
console.log('Running build...');
try {
  // Build the frontend
  console.log('Building frontend...');
  execSync('npm run build', { stdio: 'inherit' });

  // Build the server
  console.log('Building server...');
  execSync('npm run build:server', { stdio: 'inherit' });

  console.log('Build completed successfully!');
  console.log('You can now deploy using: vercel --prod');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
