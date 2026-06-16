import { NextResponse } from 'next/server';
import { getHealth } from '@/lib/db';

export async function GET() {
  try {
    const dbHealth = await getHealth();

    return NextResponse.json({
      status: 'healthy',
      database: dbHealth.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
