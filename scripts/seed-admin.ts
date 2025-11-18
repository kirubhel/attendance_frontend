/**
 * Seed script to create admin user
 * Run with: npx ts-node scripts/seed-admin.ts
 * Or: node scripts/seed-admin.js (after compiling)
 */

require('dotenv').config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'nardi';
const ADMIN_PASSWORD = 'P@ssw0rd';

async function seedAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('nardi-system');
    
    // Check if user already exists
    const existing = await db.collection('users').findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`⚠️  User with email "${ADMIN_EMAIL}" already exists!`);
      console.log('   Updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.collection('users').updateOne(
        { email: ADMIN_EMAIL },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('✅ Admin user password updated!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    } else {
      // Create new admin user
      console.log('📝 Creating admin user...');
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      await db.collection('users').insertOne({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
    }
    
    console.log('\n🎉 Setup complete! You can now login with:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
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

