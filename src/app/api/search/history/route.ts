/**
 * 📜 Search History API Route
 * 
 * GET /api/search/history - Get user's recent searches
 * GET /api/search/history/popular - Get popular searches
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import { getUserIdFromRequest } from '@/utils/auth';
import SearchHistory from '@/models/searchHistory.model';

/**
 * GET - Get user's search history
 * 
 * Query params:
 * - limit: Number of recent searches (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    await connectToDb();

    const history = await SearchHistory.find({ userId })
      .sort({ searchedAt: -1 })
      .limit(limit)
      .select('query category searchedAt resultCount')
      .lean();

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
    });

  } catch (error: any) {
    console.error('❌ Search history error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch search history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
