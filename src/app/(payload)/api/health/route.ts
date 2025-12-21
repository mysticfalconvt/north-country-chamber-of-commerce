import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Health check endpoint for Docker health checks
 * Returns 200 if the application is healthy
 */
export async function GET() {
  try {
    // Try to get Payload instance to verify database connection
    const payload = await getPayload({ config })
    
    // Simple health check - just verify Payload initialized
    // We don't need to query the database, just check if Payload is ready
    if (!payload) {
      return Response.json({ status: 'unhealthy', error: 'Payload not initialized' }, { status: 503 })
    }

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}

