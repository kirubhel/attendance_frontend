/**
 * Seed script to create admin user (JavaScript version)
 * Run with: node scripts/seed-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = 'nardi';
const ADMIN_PASSWORD = 'P@ssw0rd';

async function seedAdmin() {
  const MONGO_URL = process.env.MONGODB_URI || 'mongodb+srv://kirub:P%40ssw0rd@ercs-cluster.z7bgqce.mongodb.net/ercs_demo?retryWrites=true&w=majority';
  
  const client = new MongoClient(MONGO_URL);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('attendance');
    
    // Check if user already exists
    const existing = await db.collection('users').findOne({ username: ADMIN_USERNAME });
    if (existing) {
      console.log(`⚠️  User with username "${ADMIN_USERNAME}" already exists!`);
      console.log('   Updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.collection('users').updateOne(
        { username: ADMIN_USERNAME },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Admin user password updated!');
      console.log(`   Username: ${ADMIN_USERNAME}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    } else {
      // Create new admin user
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      await db.collection('users').insertOne({
        username: ADMIN_USERNAME,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${ADMIN_USERNAME}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }
    
    console.log('\n🎉 Setup complete! You can now login with:');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

seedAdmin();

