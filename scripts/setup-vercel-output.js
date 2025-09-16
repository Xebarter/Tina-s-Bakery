import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Setting up Vercel output directory...');

// Create .vercel/output directory
const outputDir = join(__dirname, '..', '.vercel', 'output');
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

// Create empty static directory for Vercel
writeFileSync(join(staticDir, '.gitkeep'), '');
console.log('✅ Created static/.gitkeep');

console.log('🚀 Vercel output setup complete');
