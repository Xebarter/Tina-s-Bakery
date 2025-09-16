import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Create .vercel/output directory structure
const outputDir = join(process.cwd(), '.vercel', 'output');
const staticDir = join(outputDir, 'static');

// Ensure directories exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
  console.log('✅ Created .vercel/output directory');
}

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

// Create empty static file to ensure directory is tracked by git
writeFileSync(join(staticDir, '.gitkeep'), '');
console.log('✅ Created static/.gitkeep');
