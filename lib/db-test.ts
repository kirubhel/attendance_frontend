/**
 * Client-side database connection test utility
 */

export async function testDatabaseConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      return {
        success: true,
        message: 'Database connection successful',
      };
    } else {
      return {
        success: false,
        message: data.error || 'Database connection failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

