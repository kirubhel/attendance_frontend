/**
 * Test database connection
 * Run with: node scripts/test-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
  const MONGO_URL = process.env.MONGODB_URI || 'mongodb+srv://kirub:P%40ssw0rd@ercs-cluster.z7bgqce.mongodb.net/ercs_demo?retryWrites=true&w=majority';
  
  const client = new MongoClient(MONGO_URL);
  
  try {
    console.log('🔌 Testing MongoDB connection...\n');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = client.db('attendance');
    
    // Test ping
    await db.admin().ping();
    console.log('✅ Database ping successful');
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`\n📊 Found ${collections.length} collection(s):`);
    collections.forEach(c => console.log(`   - ${c.name}`));
    
    // Test write operation
    console.log('\n🧪 Testing write operation...');
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Connection test'
    });
    console.log(`✅ Write test successful (ID: ${result.insertedId})`);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');
    
    console.log('\n🎉 All tests passed! Database is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('   Please check:');
    console.error('   1. MONGODB_URI is correct in .env.local');
    console.error('   2. Your IP is whitelisted in MongoDB Atlas');
    console.error('   3. Database user credentials are correct');
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Connection closed');
  }
}

testConnection();

