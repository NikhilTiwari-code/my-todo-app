/**
 * 📰 NewsAPI Integration
 * 
 * Fetches trending news from NewsAPI.org
 * Free tier: 100 requests/day
 * 
 * @see https://newsapi.org/docs
 */

import axios from 'axios';

const NEWS_API_KEY = process.env.NEWS_API_KEY || '';
const NEWS_API_BASE_URL = 'https://newsapi.org/v2';

/**
 * NewsAPI Article interface
 */
export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

/**
 * Fetch top headlines from NewsAPI
 * 
 * @param category - Category: business, entertainment, general, health, science, sports, technology
 * @param country - Country code (e.g., 'us', 'in', 'gb')
 * @param pageSize - Number of articles to fetch (max 100)
 */
export async function fetchTopHeadlines(
  category: string = 'general',
  country: string = 'us',
  pageSize: number = 20
): Promise<NewsArticle[]> {
  try {
    if (!NEWS_API_KEY) {
      console.warn('⚠️ NEWS_API_KEY not configured');
      return [];
    }

    const response = await axios.get(`${NEWS_API_BASE_URL}/top-headlines`, {
      params: {
        apiKey: NEWS_API_KEY,
        category,
        country,
        pageSize,
      },
      timeout: 10000, // 10 second timeout
    });

    if (response.data.status === 'ok') {
      return response.data.articles || [];
    }

    console.error('NewsAPI error:', response.data.message);
    return [];
  } catch (error: any) {
    console.error('❌ NewsAPI fetch error:', error.message);
    return [];
  }
}

/**
 * Search news articles by keyword
 * 
 * @param query - Search query
 * @param sortBy - Sort by: relevancy, popularity, publishedAt
 * @param pageSize - Number of articles
 */
export async function searchNews(
  query: string,
  sortBy: 'relevancy' | 'popularity' | 'publishedAt' = 'publishedAt',
  pageSize: number = 20
): Promise<NewsArticle[]> {
  try {
    if (!NEWS_API_KEY) {
      console.warn('⚠️ NEWS_API_KEY not configured');
      return [];
    }

    const response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
      params: {
        apiKey: NEWS_API_KEY,
        q: query,
        sortBy,
        pageSize,
        language: 'en',
      },
      timeout: 10000,
    });

    if (response.data.status === 'ok') {
      return response.data.articles || [];
    }

    return [];
  } catch (error: any) {
    console.error('❌ NewsAPI search error:', error.message);
    return [];
  }
}

/**
 * Convert NewsAPI article to TrendingTopic format
 */
export function convertNewsToTrending(article: NewsArticle, category: string = 'news') {
  return {
    title: article.title,
    category,
    source: 'NewsAPI',
    url: article.url,
    imageUrl: article.urlToImage || undefined,
    description: article.description || undefined,
    publishedAt: new Date(article.publishedAt),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    metadata: {
      author: article.author || article.source.name,
    },
  };
}

/**
 * Fetch trending news and convert to our format
 * 
 * @param categories - Array of categories to fetch
 */
export async function getTrendingNews(
  categories: string[] = ['general', 'technology', 'business']
): Promise<any[]> {
  const allArticles: any[] = [];

  for (const category of categories) {
    const articles = await fetchTopHeadlines(category, 'us', 10);
    const converted = articles.map(article => 
      convertNewsToTrending(article, category === 'general' ? 'news' : category)
    );
    allArticles.push(...converted);
  }

  return allArticles;
}
