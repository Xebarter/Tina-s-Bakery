import { mkdirSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create .vercel/output directory structure
const outputDir = join(process.cwd(), '.vercel', 'output');
const staticDir = join(outputDir, 'static');

// Ensure directories exist
function ensureDirectoryExists(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
}

// Create Vercel output structure
function createVercelOutput() {
  try {
    // Create necessary directories
    ensureDirectoryExists(outputDir);
    ensureDirectoryExists(staticDir);
    ensureDirectoryExists(join(outputDir, 'functions'));
    ensureDirectoryExists(join(outputDir, 'functions', 'api'));
    ensureDirectoryExists(join(outputDir, 'functions', 'pesapal'));

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

    const configPath = join(outputDir, 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Created Vercel config at: ${configPath}`);

    // Create a simple function to handle API routes
    const apiFunction = `// This is a serverless function that will handle all API routes
export default async function handler(req, res) {
  // This will be replaced by the actual API implementation
  return res.status(404).json({ error: 'Not found' });
}`;

    // Write API function
    writeFileSync(join(outputDir, 'functions', 'api', 'index.js'), apiFunction);
    writeFileSync(join(outputDir, 'functions', 'pesapal', 'index.js'), apiFunction);

    return true;
  } catch (error) {
    console.error('❌ Error creating Vercel output:', error);
    return false;
  }
}

// Main build function
async function build() {
  console.log('🚀 Starting Vercel build process...');
  
  try {
    // 1. Create Vercel output structure
    console.log('🛠️  Creating Vercel output structure...');
    if (!createVercelOutput()) {
      throw new Error('Failed to create Vercel output structure');
    }

    // 2. Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // 3. Build frontend
    console.log('🏗️  Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });

    // 4. Copy frontend files to static directory
    console.log('📂 Copying frontend files...');
    execSync(`xcopy /E /I /Y "${join(process.cwd(), 'dist')}\\*" "${staticDir}\"`, { stdio: 'inherit' });

    // 5. Build server
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
build();
