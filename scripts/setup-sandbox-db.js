// scripts/setup-sandbox-db.js
// Script to create and set up the sandbox database

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up JUNIOR Sandbox Database...');
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

// Extract database connection details
const dbUrl = new URL(envVars.DATABASE_URL);
const dbName = dbUrl.pathname.slice(1); // Remove leading slash
const baseDbUrl = envVars.DATABASE_URL.replace(`/${dbName}`, '/postgres');

console.log(`Database Name: ${dbName}`);
console.log(`Base Connection: ${baseDbUrl.replace(/:[^:]+@/, ':***@')}`); // Hide password
console.log();

// First, create the database
console.log('📦 Creating sandbox database...');

const createDb = spawn('npx', ['prisma', 'db', 'push', '--force-reset'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: envVars.DATABASE_URL },
  shell: true
});

createDb.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Sandbox database created successfully!');
    console.log();
    console.log('🎯 Next steps:');
    console.log('1. Run: start-sandbox.bat');
    console.log('2. Or run: npm run test:sandbox');
    console.log('3. Access: http://localhost:4001');
  } else {
    console.error(`❌ Failed to create sandbox database (exit code: ${code})`);
    console.log();
    console.log('🔍 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running on port 5433');
    console.log('2. Check that user "postgres" has permissions to create databases');
    console.log('3. Verify the DATABASE_URL in .env.sandbox is correct');
  }
});

createDb.on('error', (error) => {
  console.error('Failed to start database setup:', error);
});