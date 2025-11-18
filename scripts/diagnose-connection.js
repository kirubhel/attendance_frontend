require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
const dns = require('dns');

const MONGO_URL = process.env.MONGODB_URI || 'mongodb+srv://kirub:P%40ssw0rd@ercs-cluster.z7bgqce.mongodb.net/ercs_demo?retryWrites=true&w=majority';

// Extract hostname from connection string
const hostnameMatch = MONGO_URL.match(/@([^/]+)/);
const hostname = hostnameMatch ? hostnameMatch[1] : null;

console.log('🔍 MongoDB Connection Diagnostics\n');
console.log('Connection String:', MONGO_URL.replace(/:[^:@]+@/, ':****@'));
console.log('Hostname:', hostname);
console.log('');

// Test DNS resolution
async function testDNS() {
  console.log('1️⃣ Testing DNS Resolution...');
  
  // Try with system DNS
  try {
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('   ✅ DNS Resolution successful (System DNS)');
    console.log('   📍 IP Addresses:', addresses.join(', '));
    return true;
  } catch (error) {
    console.log('   ❌ DNS Resolution failed (System DNS):', error.message);
  }
  
  // Try with Google DNS
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('   ✅ DNS Resolution successful (Google DNS)');
    console.log('   📍 IP Addresses:', addresses.join(', '));
    return true;
  } catch (error) {
    console.log('   ❌ DNS Resolution failed (Google DNS):', error.message);
  }
  
  // Try with Cloudflare DNS
  try {
    dns.setServers(['1.1.1.1', '1.0.0.1']);
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    console.log('   ✅ DNS Resolution successful (Cloudflare DNS)');
    console.log('   📍 IP Addresses:', addresses.join(', '));
    return true;
  } catch (error) {
    console.log('   ❌ DNS Resolution failed (Cloudflare DNS):', error.message);
  }
  
  return false;
}

// Test MongoDB connection
async function testMongoConnection() {
  console.log('\n2️⃣ Testing MongoDB Connection...');
  
  // Set alternative DNS servers
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
  } catch (error) {
    console.log('   ⚠️  Could not set alternative DNS servers');
  }
  
  const client = new MongoClient(MONGO_URL, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  });
  
  try {
    console.log('   🔌 Attempting connection...');
    await client.connect();
    console.log('   ✅ MongoDB connection successful!');
    
    const db = client.db('attendance');
    await db.admin().ping();
    console.log('   ✅ Database ping successful');
    
    await client.close();
    return true;
  } catch (error) {
    console.log('   ❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ETIMEOUT') || error.message.includes('queryTxt')) {
      console.log('\n   💡 DNS Resolution Issue Detected!');
      console.log('   Possible causes:');
      console.log('   1. MongoDB Atlas cluster is paused (free tier)');
      console.log('   2. Cluster hostname has changed');
      console.log('   3. Network/DNS blocking');
      console.log('\n   🔧 Solutions:');
      console.log('   1. Check MongoDB Atlas dashboard - ensure cluster is running');
      console.log('   2. Get a fresh connection string from Atlas');
      console.log('   3. Check Network Access settings in Atlas');
      console.log('   4. Try using a VPN or different network');
    }
    
    return false;
  }
}

// Main diagnostic
async function runDiagnostics() {
  const dnsOk = await testDNS();
  const mongoOk = await testMongoConnection();
  
  console.log('\n📊 Summary:');
  console.log('   DNS Resolution:', dnsOk ? '✅ OK' : '❌ FAILED');
  console.log('   MongoDB Connection:', mongoOk ? '✅ OK' : '❌ FAILED');
  
  if (!dnsOk && !mongoOk) {
    console.log('\n⚠️  Both DNS and MongoDB connection failed.');
    console.log('   This usually means:');
    console.log('   1. The MongoDB Atlas cluster is paused or deleted');
    console.log('   2. The hostname in the connection string is incorrect');
    console.log('   3. Network connectivity issues');
    console.log('\n   📝 Next Steps:');
    console.log('   1. Log into MongoDB Atlas: https://cloud.mongodb.com');
    console.log('   2. Check if your cluster is running (not paused)');
    console.log('   3. Click "Connect" on your cluster and get a fresh connection string');
    console.log('   4. Update MONGODB_URI in .env.local with the new connection string');
  }
}

runDiagnostics().catch(console.error);

