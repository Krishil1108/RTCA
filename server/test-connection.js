const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  const mongoUri = process.env.MONGODB_URI;
  const isAtlas = mongoUri.includes('mongodb+srv://');
  
  console.log('🔍 Testing MongoDB connection...');
  console.log(`📍 Target: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
  console.log(`🔗 URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000 // 10 second timeout
    });
    
    console.log('✅ Connection successful!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🏠 Host: ${mongoose.connection.host}`);
    console.log(`🚪 Port: ${mongoose.connection.port}`);
    console.log(`📈 Ready State: ${mongoose.connection.readyState}`);
    
    // Test basic operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📦 Collections: ${collections.length} found`);
    
    if (collections.length > 0) {
      console.log('📋 Collection names:');
      collections.forEach(col => console.log(`   - ${col.name}`));
    }
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error(`🔥 Error: ${error.message}`);
    
    if (isAtlas) {
      console.log('\n💡 Atlas Troubleshooting Tips:');
      console.log('   1. Check your connection string format');
      console.log('   2. Verify username and password are correct');
      console.log('   3. Ensure your IP is whitelisted in Atlas');
      console.log('   4. Check if cluster is running and accessible');
      console.log('   5. Verify network connectivity (firewall, VPN)');
    } else {
      console.log('\n💡 Local MongoDB Troubleshooting Tips:');
      console.log('   1. Ensure MongoDB is running locally');
      console.log('   2. Check if MongoDB service is started');
      console.log('   3. Verify the connection URI is correct');
    }
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

testConnection();
