import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = new URL('.', import.meta.url).pathname;

async function setupVercelOutput() {
  try {
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
    
    return true;
  } catch (error) {
    console.error('❌ Error setting up Vercel output:', error);
    return false;
  }
}

async function runBuild() {
  console.log('🚀 Starting Vercel build process...');
  
  try {
    // 1. Setup Vercel output
    console.log('🛠️  Setting up Vercel output...');
    const setupSuccess = await setupVercelOutput();
    if (!setupSuccess) {
      throw new Error('Failed to set up Vercel output');
    }

    // 2. Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // 3. Build frontend
    console.log('🏗️  Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });

    // 4. Build server
    console.log('⚙️  Building server...');
    execSync('npm run build:server', { stdio: 'inherit' });

    console.log('✨ Build completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
runBuild();
