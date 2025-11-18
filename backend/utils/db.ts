import { MongoClient, Db } from 'mongodb';
import dns from 'dns';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// Try to use alternative DNS servers if default DNS fails
// This helps with DNS resolution issues
try {
  // Use Google DNS and Cloudflare DNS as fallback
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
  console.log('✅ Using alternative DNS servers (8.8.8.8, 1.1.1.1)');
} catch (error) {
  console.warn('⚠️  Could not set alternative DNS servers, using system default');
}

// Connection options with timeout and retry settings
const options = {
  serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection (increased for DNS)
  socketTimeoutMS: 45000, // 45 seconds timeout for socket operations
  connectTimeoutMS: 30000, // 30 seconds timeout for initial connection (increased for DNS)
  maxPoolSize: 10, // Maximum number of connections in the pool
  minPoolSize: 1, // Minimum number of connections in the pool
  retryWrites: true,
  retryReads: true,
  // Additional options to help with connection
  directConnection: false,
  tls: true,
  tlsAllowInvalidCertificates: false,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Helper function to create client with retry logic
function createClient(): MongoClient {
  try {
    return new MongoClient(uri, options);
  } catch (error) {
    console.error('Error creating MongoDB client:', error);
    throw error;
  }
}

// Helper function to connect with retry logic
async function connectWithRetry(client: MongoClient, retries = 3): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting MongoDB connection (attempt ${i + 1}/${retries})...`);
      await client.connect();
      console.log('✅ MongoDB connected successfully');
      return client;
    } catch (error: any) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      // Check for DNS/timeout errors and provide specific guidance
      if (error.message?.includes('ETIMEOUT') || error.message?.includes('queryTxt')) {
        console.error('\n⚠️  DNS Resolution Error Detected!');
        console.error('   This usually means:');
        console.error('   1. MongoDB Atlas cluster is PAUSED (free tier clusters pause after inactivity)');
        console.error('   2. The cluster hostname has changed');
        console.error('   3. Network/DNS issues');
        console.error('\n   🔧 Please:');
        console.error('   1. Log into MongoDB Atlas: https://cloud.mongodb.com');
        console.error('   2. Check if your cluster is running (not paused)');
        console.error('   3. If paused, click "Resume" to start the cluster');
        console.error('   4. Get a fresh connection string from Atlas "Connect" button');
        console.error('   5. Update MONGODB_URI in .env.local\n');
      }
      
      if (i === retries - 1) {
        // Last attempt failed
        let errorMessage = `Failed to connect to MongoDB after ${retries} attempts. `;
        errorMessage += `Last error: ${error.message}. `;
        
        if (error.message?.includes('ETIMEOUT') || error.message?.includes('queryTxt')) {
          errorMessage += '\n\nDNS Resolution Error - Your MongoDB Atlas cluster may be paused. ';
          errorMessage += 'Please check your Atlas dashboard and resume the cluster if needed.';
        } else {
          errorMessage += 'Please check your network connection and MongoDB Atlas cluster status.';
        }
        
        throw new Error(errorMessage);
      }
      
      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw new Error('Unexpected error in connection retry logic');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = createClient();
    globalWithMongo._mongoClientPromise = connectWithRetry(client);
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = createClient();
  clientPromise = connectWithRetry(client);
}

export async function getDb(): Promise<Db> {
  try {
    const client = await clientPromise;
    // Test the connection with a shorter timeout for ping
    try {
      await Promise.race([
        client.db('admin').command({ ping: 1 }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
    } catch (pingError) {
      // If ping fails, try to reconnect
      console.warn('Ping failed, attempting to reconnect...');
      // The connection will be retried automatically on next use
    }
    return client.db('attendance');
  } catch (error: any) {
    console.error('Error getting database:', error);
    
    // Provide more helpful error messages
    if (error.message?.includes('ETIMEOUT') || error.message?.includes('queryTxt')) {
      throw new Error(
        `Database connection timeout. Please check:\n` +
        `1. MongoDB Atlas Network Access - ensure your IP is whitelisted\n` +
        `2. Cluster is running (not paused)\n` +
        `3. Connection string is correct\n` +
        `Original error: ${error.message}`
      );
    }
    
    throw new Error(
      `Database connection error: ${error.message}. ` +
      `Please ensure MongoDB Atlas cluster is running and accessible.`
    );
  }
}

export default clientPromise;

