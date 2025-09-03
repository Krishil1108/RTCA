const fs = require('fs');
const path = require('path');

// Ensure auth directories exist
const successDir = path.join(__dirname, 'build', 'auth', 'success');
const errorDir = path.join(__dirname, 'build', 'auth', 'error');

// Create directories if they don't exist
fs.mkdirSync(successDir, { recursive: true });
fs.mkdirSync(errorDir, { recursive: true });

// Copy index.html to auth directories
const indexPath = path.join(__dirname, 'build', 'index.html');
const successPath = path.join(successDir, 'index.html');
const errorPath = path.join(errorDir, 'index.html');

try {
  fs.copyFileSync(indexPath, successPath);
  fs.copyFileSync(indexPath, errorPath);
  console.log('✅ Auth files copied successfully');
} catch (error) {
  console.error('❌ Error copying auth files:', error.message);
  process.exit(1);
}
