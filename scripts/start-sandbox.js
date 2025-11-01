// scripts/start-sandbox.js
// Script to start the application in sandbox mode with proper environment variables

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting JUNIOR Trading App in SANDBOX MODE...');
console.log();
console.log('Environment: SANDBOX');
console.log('Database: trading_app_sandbox');
console.log('Port: 4001');
console.log('Mock Broker: ENABLED');
console.log();

// Load environment variables from .env.sandbox
const envPath = path.join(__dirname, '..', '.env.sandbox');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      envVars[key] = value;
    }
  }
});

// Merge with existing environment variables
const env = { ...process.env, ...envVars };

// Override PORT to ensure it uses the sandbox port
env.PORT = envVars.PORT || '4001';

console.log('Loaded environment variables from .env.sandbox:');
console.log(`DATABASE_URL: ${env.DATABASE_URL}`);
console.log(`APP_ENV: ${env.APP_ENV}`);
console.log(`SANDBOX_MODE: ${env.SANDBOX_MODE}`);
console.log(`PORT: ${env.PORT}`);
console.log();

// Start the development server
const npm = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env,
  shell: true
});

npm.on('close', (code) => {
  console.log(`Sandbox server exited with code ${code}`);
});

npm.on('error', (error) => {
  console.error('Failed to start sandbox server:', error);
});