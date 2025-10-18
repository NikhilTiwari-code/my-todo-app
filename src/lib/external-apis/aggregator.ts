/**
 * 🎯 Trending Aggregator
 * 
 * Combines data from all external APIs and saves to database
 * Implements caching and rate limiting
 * 
 * @version 1.0.0
 */

import { getTrendingNews } from './newsapi';
import { getTrendingYouTube } from './youtube';
import { getTrendingReddit } from './reddit';
import { getTrendingHackerNews } from './hackernews';
import { getTrendingCrypto } from './coingecko';
import TrendingTopic from '@/models/trending.model';
import connectToDb from '@/utils/db';

/**
 * Fetch all trending data from external APIs
 * 
 * @param categories - Array of categories to fetch
 * @returns Object with trending data by category
 */
export async function fetchAllTrending(
  categories: string[] = ['news', 'youtube', 'tech', 'crypto']
) {
  const results: any = {
    news: [],
    youtube: [],
    tech: [],
    crypto: [],
    timestamp: new Date(),
  };

  // Fetch all sources in parallel for better performance
  const promises: Promise<void>[] = [];

  if (categories.includes('news')) {
    promises.push(
      getTrendingNews(['general', 'technology', 'business'])
        .then(data => { results.news = data; })
        .catch(err => console.error('News fetch failed:', err))
    );
  }

  if (categories.includes('youtube')) {
    promises.push(
      getTrendingYouTube(['0']) // 0 = all categories
        .then(data => { results.youtube = data; })
        .catch(err => console.error('YouTube fetch failed:', err))
    );
  }

  if (categories.includes('tech')) {
    promises.push(
      Promise.all([
        getTrendingReddit(['technology', 'programming', 'webdev']),
        getTrendingHackerNews(),
      ])
        .then(([reddit, hn]) => { 
          results.tech = [...reddit, ...hn].sort((a, b) => b.score - a.score);
        })
        .catch(err => console.error('Tech fetch failed:', err))
    );
  }

  if (categories.includes('crypto')) {
    promises.push(
      getTrendingCrypto()
        .then(data => { results.crypto = data; })
        .catch(err => console.error('Crypto fetch failed:', err))
    );
  }

  await Promise.all(promises);

  return results;
}

/**
 * Save trending data to database with ranking
 * 
 * @param trendingData - Trending data from fetchAllTrending()
 */
export async function saveTrendingToDatabase(trendingData: any) {
  try {
    await connectToDb();

    // Delete old trending data for these categories
    const categories = Object.keys(trendingData).filter(k => k !== 'timestamp');
    await TrendingTopic.deleteMany({ 
      category: { $in: categories } 
    });

    // Prepare all items with rankings
    const allItems: any[] = [];
    
    for (const category of categories) {
      const items = trendingData[category] || [];
      
      // Assign rankings (1-50)
      items.forEach((item: any, index: number) => {
        allItems.push({
          ...item,
          rank: index + 1,
          category: item.category || category,
        });
      });
    }

    // Bulk insert
    if (allItems.length > 0) {
      const inserted = await TrendingTopic.insertMany(allItems, { 
        ordered: false,  // Continue on error
        lean: true,
      });
      
      console.log(`✅ Saved ${inserted.length} trending items to database`);
      return inserted;
    }

    console.log('⚠️ No trending items to save');
    return [];
  } catch (error: any) {
    console.error('❌ Database save error:', error.message);
    throw error;
  }
}

/**
 * Fetch and save all trending data (main function for cron job)
 * 
 * @param categories - Categories to fetch
 */
export async function updateTrendingData(
  categories: string[] = ['news', 'youtube', 'tech', 'crypto']
) {
  console.log(`🔄 Fetching trending data for: ${categories.join(', ')}`);
  
  const startTime = Date.now();
  
  try {
    // Fetch from all APIs
    const trendingData = await fetchAllTrending(categories);
    
    // Save to database
    const saved = await saveTrendingToDatabase(trendingData);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Trending update completed in ${duration}s`);
    
    return {
      success: true,
      duration: parseFloat(duration),
      itemsSaved: saved.length,
      timestamp: new Date(),
    };
  } catch (error: any) {
    console.error('❌ Trending update failed:', error.message);
    return {
      success: false,
      error: error.message,
      timestamp: new Date(),
    };
  }
}

/**
 * Get trending data by category from database
 * 
 * @param category - Category name
 * @param limit - Number of items
 */
export async function getTrendingByCategory(
  category: string,
  limit: number = 20
) {
  try {
    await connectToDb();
    
    return await TrendingTopic.find({ category })
      .sort({ rank: 1 })
      .limit(limit)
      .lean();
  } catch (error: any) {
    console.error('❌ Get trending error:', error.message);
    return [];
  }
}

/**
 * Get all trending data grouped by category
 */
export async function getAllTrending() {
  try {
    await connectToDb();
    
    const categories = ['news', 'youtube', 'tech', 'crypto'];
    const result: any = {};
    
    for (const category of categories) {
      result[category] = await TrendingTopic.find({ category })
        .sort({ rank: 1 })
        .limit(20)
        .lean();
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Get all trending error:', error.message);
    return {};
  }
}

/**
 * Search across all trending topics
 * 
 * @param query - Search query
 * @param limit - Number of results
 */
export async function searchTrending(query: string, limit: number = 20) {
  try {
    await connectToDb();
    
    return await TrendingTopic.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .lean();
  } catch (error: any) {
    console.error('❌ Search trending error:', error.message);
    return [];
  }
}

/**
 * Get trending stats
 */
export async function getTrendingStats() {
  try {
    await connectToDb();
    
    const stats = await TrendingTopic.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          lastUpdated: { $max: '$fetchedAt' },
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    return stats;
  } catch (error: any) {
    console.error('❌ Get stats error:', error.message);
    return [];
  }
}
