/**
 * 🔥 Popular Searches API Route
 * 
 * GET /api/search/popular - Get trending searches
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import SearchHistory from '@/models/searchHistory.model';

/**
 * GET - Get popular/trending searches
 * 
 * Query params:
 * - hours: Time window in hours (default: 24)
 * - limit: Number of results (default: 10)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    await connectToDb();

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const popularSearches = await SearchHistory.aggregate([
      {
        $match: {
          searchedAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          lastSearched: { $max: '$searchedAt' },
          avgResults: { $avg: '$resultCount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          query: '$_id',
          count: 1,
          lastSearched: 1,
          avgResults: { $round: ['$avgResults', 0] }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: popularSearches,
      timeWindow: `${hours} hours`,
      count: popularSearches.length,
    });

  } catch (error: any) {
    console.error('❌ Popular searches error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch popular searches',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
