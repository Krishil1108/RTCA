#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupAtlas() {
  console.log('\n🚀 Arizta - MongoDB Atlas Setup');
  console.log('================================\n');
  
  console.log('📋 Before we start, make sure you have:');
  console.log('   ✅ Created a MongoDB Atlas account');
  console.log('   ✅ Created a cluster');
  console.log('   ✅ Set up database user credentials');
  console.log('   ✅ Configured network access (IP whitelist)\n');
  
  const proceed = await question('Ready to configure? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('👋 Setup cancelled. Run this script when ready!');
    process.exit(0);
  }
  
  console.log('\n🔗 Atlas Connection String Setup');
  console.log('Your connection string should look like:');
  console.log('mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rtca-chat?retryWrites=true&w=majority\n');
  
  const connectionString = await question('Paste your Atlas connection string: ');
  
  if (!connectionString.includes('mongodb+srv://')) {
    console.log('❌ Invalid connection string format. Please ensure it starts with mongodb+srv://');
    process.exit(1);
  }
  
  // Update .env file
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    // Create from example
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, 'utf8');
    }
  }
  
  // Replace MongoDB URI
  envContent = envContent.replace(
    /MONGODB_URI=.*/,
    `MONGODB_URI=${connectionString}`
  );
  
  // Set NODE_ENV to development for now
  envContent = envContent.replace(
    /NODE_ENV=.*/,
    'NODE_ENV=development'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with Atlas connection string');
  
  // Test connection
  console.log('\n🔍 Testing connection...');
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    await mongoose.disconnect();
    
    console.log('\n🎉 Atlas setup complete!');
    console.log('You can now start your server with: npm start');
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    console.log('\n💡 Common issues:');
    console.log('   - Check username/password in connection string');
    console.log('   - Verify IP is whitelisted in Atlas');
    console.log('   - Ensure cluster is running');
  }
  
  rl.close();
}

setupAtlas().catch(console.error);
