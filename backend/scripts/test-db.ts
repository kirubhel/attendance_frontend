/**
 * Test MongoDB connection
 * Run with: npx ts-node scripts/test-db.ts
 * Make sure MONGODB_URI is set in .env
 */

require('dotenv').config();
import { testConnection } from '../utils/test-connection';
import { getDb } from '../utils/db';

async function runTests() {
  console.log('Testing MongoDB connection...\n');
  
  const connected = await testConnection();
  
  if (!connected) {
    console.error('\n❌ Connection test failed. Please check your MONGODB_URI.');
    process.exit(1);
  }

  try {
    const db = await getDb();
    
    // Test collections
    console.log('\n📊 Checking collections...');
    const collections = await db.listCollections().toArray();
    console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));
    
    // Test creating a test document
    console.log('\n🧪 Testing write operation...');
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Write test successful');
    
    // Clean up
    await testCollection.deleteOne({ test: true });
    console.log('✅ Cleanup successful');
    
    console.log('\n✅ All tests passed! Database is ready to use.');
  } catch (error) {
    console.error('\n❌ Error during tests:', error);
    process.exit(1);
  }
}

runTests();

