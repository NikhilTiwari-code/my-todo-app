/**
 * 🔍 Universal Search API Route
 * 
 * GET /api/search?q=query - Universal search across all content
 * 
 * Searches:
 * - Users
 * - Posts
 * - Reels
 * - Trending topics
 * - Hashtags
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDb from '@/utils/db';
import { getUserIdFromRequest } from '@/utils/auth';
import User from '@/models/user.models';
import Post from '@/models/post.model';
import TrendingTopic from '@/models/trending.model';
import HashtagStats from '@/models/hashtagStats.model';
import SearchHistory from '@/models/searchHistory.model';

/**
 * GET - Universal search
 * 
 * Query params:
 * - q: Search query (required)
 * - type: Filter by type (users, posts, reels, trending, hashtags, all)
 * - limit: Number of results per type (default: 10)
 * - category: Filter trending by category
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const category = searchParams.get('category');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    await connectToDb();

    // Get user ID for search history (optional)
    let userId: string | null = null;
    try {
      const authResult = await getUserIdFromRequest(req);
      if (!('error' in authResult)) {
        userId = authResult.userId;
      }
    } catch (err) {
      // Continue without user ID
    }

    const results: any = {
      query,
      results: {},
      timestamp: new Date(),
    };

    // Search users
    if (type === 'all' || type === 'users') {
      const users = await User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ]
      })
        .select('name email avatar bio followers following')
        .limit(limit)
        .lean();

      results.results.users = users;
    }

    // Search posts
    if (type === 'all' || type === 'posts') {
      const posts = await Post.find({
        $or: [
          { caption: { $regex: query, $options: 'i' } },
          { hashtags: { $regex: query, $options: 'i' } },
        ]
      })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      results.results.posts = posts;
    }

    // Search reels (if you have a Reel model)
    if (type === 'all' || type === 'reels') {
      // TODO: Implement reel search when model exists
      results.results.reels = [];
    }

    // Search trending topics
    if (type === 'all' || type === 'trending') {
      const trendingQuery: any = {
        $text: { $search: query }
      };

      if (category) {
        trendingQuery.category = category;
      }

      const trending = await TrendingTopic.find(
        trendingQuery,
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean();

      results.results.trending = trending;
    }

    // Search hashtags
    if (type === 'all' || type === 'hashtags') {
      const hashtags = await HashtagStats.find({
        hashtag: { $regex: query.replace('#', ''), $options: 'i' }
      })
        .sort({ trendingScore: -1 })
        .limit(limit)
        .select('hashtag category postCount trendingScore')
        .lean();

      results.results.hashtags = hashtags;
    }

    // Calculate total results
    results.totalResults = Object.values(results.results).reduce(
      (sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    // Save search history
    if (userId) {
      try {
        await SearchHistory.create({
          userId,
          query,
          category: category || 'all',
          resultCount: results.totalResults,
          searchedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
      } catch (err) {
        console.error('Failed to save search history:', err);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error: any) {
    console.error('❌ Search API error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Search failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear search history
 */
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    await SearchHistory.deleteMany({ userId });

    return NextResponse.json({
      success: true,
      message: 'Search history cleared',
    });

  } catch (error: any) {
    console.error('❌ Clear history error:', error.message);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear history',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
