/**
 * Script to create an admin user
 * Run with: node scripts/create-admin.js
 * Make sure MONGODB_URI is set in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function createAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI not found in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('nardi-system');
    
    // Get email and password from command line args or use defaults
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    
    // Check if user already exists
    const existing = await db.collection('users').findOne({ email });
    if (existing) {
      console.log(`User with email ${email} already exists!`);
      await client.close();
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date()
    });
    
    console.log(`✅ Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createAdmin();

