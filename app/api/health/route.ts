import { NextResponse } from 'next/server';
import { getDb } from '@backend/utils/db';

/**
 * Health check endpoint to test database connection
 */
export async function GET() {
  try {
    const db = await getDb();
    // Test the connection with a simple command
    await db.admin().ping();
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message || 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
