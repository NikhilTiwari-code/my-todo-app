/**
 * 🔥 Trending API Route
 * 
 * GET /api/trending - Get all trending topics
 * GET /api/trending?category=news - Get trending by category
 * 
 * Supports Redis caching for performance
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import TrendingTopic from '@/models/trending.model';
import { getAllTrending, getTrendingByCategory } from '@/lib/external-apis/aggregator';
import { getCachedTrending, setCachedTrending } from '@/lib/cache/trending-cache';

/**
 * GET - Fetch trending topics
 * 
 * Query params:
 * - category: Filter by category (news, youtube, tech, crypto)
 * - limit: Number of items (default: 20, max: 50)
 * - page: Page number for pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Try cache first (only for page 1)
    if (page === 1) {
      const cacheKey = category || 'all';
      const cached = await getCachedTrending(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    await connectToDb();

    // If category specified, return filtered results
    if (category) {
      const validCategories = ['news', 'youtube', 'tech', 'crypto', 'entertainment', 'sports', 'politics'];
      
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category', validCategories },
          { status: 400 }
        );
      }

      const trending = await TrendingTopic.find({ category })
        .sort({ rank: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await TrendingTopic.countDocuments({ category });

      return NextResponse.json({
        success: true,
        category,
        data: trending,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }

    // Return all categories
    const allTrending = await getAllTrending();
    
    // Get total counts per category
    const stats = await TrendingTopic.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          lastUpdated: { $max: '$fetchedAt' },
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: allTrending,
      stats,
      timestamp: new Date(),
    });

  } catch (error: any) {
    console.error('❌ Trending API error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch trending topics',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Manually trigger trending update (admin only)
 * 
 * Body:
 * - categories: Array of categories to update
 * - apiKey: Admin API key for authentication
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categories, apiKey } = body;

    // Verify admin API key
    const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
    if (!ADMIN_API_KEY || apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { updateTrendingData } = await import('@/lib/external-apis/aggregator');
    
    const result = await updateTrendingData(
      categories || ['news', 'youtube', 'tech', 'crypto']
    );

    return NextResponse.json({
      success: true,
      message: 'Trending data updated successfully',
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
