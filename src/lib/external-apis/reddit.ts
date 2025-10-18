/**
 * 🔴 Reddit JSON API Integration
 * 
 * Fetches trending posts from Reddit
 * No API key required for basic access (rate-limited)
 * 
 * @see https://www.reddit.com/dev/api
 */

import axios from 'axios';

const REDDIT_BASE_URL = 'https://www.reddit.com';

/**
 * Reddit Post interface
 */
export interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
    url: string;
    thumbnail?: string;
    preview?: {
      images: Array<{
        source: {
          url: string;
          width: number;
          height: number;
        };
      }>;
    };
    ups: number;
    downs: number;
  };
}

/**
 * Fetch trending posts from a subreddit
 * 
 * @param subreddit - Subreddit name (without r/)
 * @param sort - Sort by: hot, new, rising, top
 * @param timeRange - For 'top': hour, day, week, month, year, all
 * @param limit - Number of posts to fetch (max 100)
 */
export async function fetchSubredditPosts(
  subreddit: string = 'popular',
  sort: 'hot' | 'new' | 'rising' | 'top' = 'hot',
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day',
  limit: number = 25
): Promise<RedditPost[]> {
  try {
    const url = `${REDDIT_BASE_URL}/r/${subreddit}/${sort}.json`;
    
    const params: any = { limit };
    if (sort === 'top') {
      params.t = timeRange;
    }

    const response = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'TrendingApp/1.0',
      },
      timeout: 10000,
    });

    if (response.data?.data?.children) {
      return response.data.data.children;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Reddit fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch posts from multiple subreddits
 * 
 * @param subreddits - Array of subreddit names
 * @param sort - Sort method
 * @param limit - Posts per subreddit
 */
export async function fetchMultipleSubreddits(
  subreddits: string[] = ['popular', 'all'],
  sort: 'hot' | 'new' | 'rising' | 'top' = 'hot',
  limit: number = 10
): Promise<RedditPost[]> {
  const allPosts: RedditPost[] = [];

  for (const subreddit of subreddits) {
    const posts = await fetchSubredditPosts(subreddit, sort, 'day', limit);
    allPosts.push(...posts);
  }

  return allPosts;
}

/**
 * Search Reddit posts by keyword
 * 
 * @param query - Search query
 * @param subreddit - Subreddit to search in (optional, default: all)
 * @param sort - Sort by: relevance, hot, top, new, comments
 * @param limit - Number of results
 */
export async function searchReddit(
  query: string,
  subreddit: string = 'all',
  sort: 'relevance' | 'hot' | 'top' | 'new' | 'comments' = 'relevance',
  limit: number = 25
): Promise<RedditPost[]> {
  try {
    const url = `${REDDIT_BASE_URL}/r/${subreddit}/search.json`;

    const response = await axios.get(url, {
      params: {
        q: query,
        sort,
        limit,
        restrict_sr: subreddit !== 'all',
      },
      headers: {
        'User-Agent': 'TrendingApp/1.0',
      },
      timeout: 10000,
    });

    if (response.data?.data?.children) {
      return response.data.data.children;
    }

    return [];
  } catch (error: any) {
    console.error('❌ Reddit search error:', error.message);
    return [];
  }
}

/**
 * Convert Reddit post to TrendingTopic format
 */
export function convertRedditToTrending(post: RedditPost, category: string = 'tech') {
  const postData = post.data;
  
  // Extract image URL
  let imageUrl = postData.thumbnail && 
    postData.thumbnail !== 'self' && 
    postData.thumbnail !== 'default' && 
    postData.thumbnail.startsWith('http')
      ? postData.thumbnail
      : undefined;

  // Try to get higher quality image from preview
  if (postData.preview?.images?.[0]?.source?.url) {
    imageUrl = postData.preview.images[0].source.url.replace(/&amp;/g, '&');
  }

  return {
    title: postData.title,
    category,
    source: 'Reddit',
    url: `${REDDIT_BASE_URL}${postData.permalink}`,
    imageUrl,
    description: postData.selftext?.substring(0, 200) || undefined,
    publishedAt: new Date(postData.created_utc * 1000),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      author: `u/${postData.author}`,
      likes: postData.ups,
      comments: postData.num_comments,
    },
  };
}

/**
 * Calculate engagement score for Reddit post
 */
export function calculateRedditScore(post: RedditPost): number {
  const postData = post.data;
  
  // Engagement formula: (upvotes + comments * 2) with recency decay
  const score = postData.score || postData.ups;
  const comments = postData.num_comments;
  
  const hoursAgo = (Date.now() - postData.created_utc * 1000) / (1000 * 60 * 60);
  const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / 48)); // Decay over 2 days
  
  return Math.round((score + comments * 2) * recencyMultiplier);
}

/**
 * Fetch trending Reddit posts and convert to our format
 * 
 * @param subreddits - Tech-focused subreddits by default
 */
export async function getTrendingReddit(
  subreddits: string[] = [
    'technology',
    'programming',
    'webdev',
    'dataisbeautiful',
    'futurology',
  ]
): Promise<any[]> {
  const allPosts: any[] = [];

  for (const subreddit of subreddits) {
    const posts = await fetchSubredditPosts(subreddit, 'hot', 'day', 10);
    const converted = posts.map(post => {
      const trending = convertRedditToTrending(post, 'tech');
      return {
        ...trending,
        score: calculateRedditScore(post),
      };
    });
    allPosts.push(...converted);
  }

  // Sort by score and return top items
  return allPosts.sort((a, b) => b.score - a.score);
}

/**
 * Popular subreddits by category (for reference)
 */
export const SUBREDDIT_CATEGORIES = {
  tech: ['technology', 'programming', 'webdev', 'gamedev', 'datascience'],
  news: ['worldnews', 'news', 'politics', 'UpliftingNews'],
  entertainment: ['movies', 'television', 'Music', 'gaming', 'books'],
  sports: ['sports', 'nba', 'nfl', 'soccer', 'formula1'],
  crypto: ['cryptocurrency', 'Bitcoin', 'ethereum', 'CryptoMarkets'],
};
