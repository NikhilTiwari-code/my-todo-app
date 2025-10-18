/**
 * 🔧 Cron Job Manual Trigger
 * 
 * POST /api/cron/trigger - Manually trigger trending update
 * 
 * Used for development and manual testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateTrendingData } from '@/lib/external-apis/aggregator';

/**
 * POST - Manually trigger trending data update
 * 
 * Body (optional):
 * - categories: Array of categories to update
 * - apiKey: Admin API key for authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { categories, apiKey } = body;

    // Verify admin API key (optional in development)
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (!isDev && ADMIN_API_KEY && apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      );
    }

    console.log('🔄 Manual trending update triggered');

    const result = await updateTrendingData(
      categories || ['news', 'youtube', 'tech', 'crypto']
    );

    return NextResponse.json({
      success: true,
      message: 'Trending data update completed',
      result,
    });

  } catch (error: any) {
    console.error('❌ Manual update error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update trending data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get cron job status and last run info
 */
export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Cron trigger endpoint is active',
      endpoints: {
        trigger: 'POST /api/cron/trigger',
        description: 'Manually trigger trending data update',
      },
      note: 'In production, use ADMIN_API_KEY for authentication',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
