/**
 * #️⃣ Trending Hashtags API Route
 * 
 * GET /api/hashtags/trending - Get trending hashtags
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import HashtagStats from '@/models/hashtagStats.model';

/**
 * GET - Get trending hashtags
 * 
 * Query params:
 * - category: Filter by category
 * - limit: Number of hashtags (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    await connectToDb();

    const query = category ? { category } : {};

    const trending = await HashtagStats.find(query)
      .sort({ trendingScore: -1, lastUsed: -1 })
      .limit(limit)
      .select('hashtag category trendingScore postCount todayCount avgEngagement')
      .lean();

    return NextResponse.json({
      success: true,
      data: trending,
      count: trending.length,
      category: category || 'all',
    });

  } catch (error: any) {
    console.error('❌ Trending hashtags error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch trending hashtags',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
