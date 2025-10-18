/**
 * 📺 YouTube Data API Integration
 * 
 * Fetches trending videos from YouTube
 * Free tier: 10,000 units/day
 * 
 * @see https://developers.google.com/youtube/v3
 */

import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * YouTube Video interface
 */
export interface YouTubeVideo {
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    liveBroadcastContent: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

/**
 * Fetch trending videos from YouTube
 * 
 * @param regionCode - Region code (e.g., 'US', 'IN', 'GB')
 * @param videoCategoryId - Category ID (optional)
 * @param maxResults - Number of videos to fetch (max 50)
 */
export async function fetchTrendingVideos(
  regionCode: string = 'US',
  videoCategoryId?: string,
  maxResults: number = 25
): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('⚠️ YOUTUBE_API_KEY not configured');
      return [];
    }

    const params: any = {
      part: 'snippet,statistics',
      chart: 'mostPopular',
      regionCode,
      maxResults,
      key: YOUTUBE_API_KEY,
    };

    if (videoCategoryId) {
      params.videoCategoryId = videoCategoryId;
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params,
      timeout: 10000,
    });

    return response.data.items || [];
  } catch (error: any) {
    console.error('❌ YouTube API fetch error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Search YouTube videos by keyword
 * 
 * @param query - Search query
 * @param maxResults - Number of results
 * @param order - Sort order: date, rating, relevance, title, videoCount, viewCount
 */
export async function searchVideos(
  query: string,
  maxResults: number = 20,
  order: 'date' | 'rating' | 'relevance' | 'viewCount' = 'relevance'
): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.warn('⚠️ YOUTUBE_API_KEY not configured');
      return [];
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        order,
        maxResults,
        key: YOUTUBE_API_KEY,
      },
      timeout: 10000,
    });

    // Fetch video statistics for the found videos
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    
    if (videoIds) {
      const statsResponse = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
        params: {
          part: 'snippet,statistics',
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
        timeout: 10000,
      });

      return statsResponse.data.items || [];
    }

    return [];
  } catch (error: any) {
    console.error('❌ YouTube search error:', error.message);
    return [];
  }
}

/**
 * Convert YouTube video to TrendingTopic format
 */
export function convertYouTubeToTrending(video: any) {
  // Extract videoId based on response type
  const videoId = typeof video.id === 'string' ? video.id : video.id?.videoId;
  
  return {
    title: video.snippet.title,
    category: 'youtube',
    source: 'YouTube',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    imageUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url,
    description: video.snippet.description?.substring(0, 200) || undefined,
    publishedAt: new Date(video.snippet.publishedAt),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      author: video.snippet.channelTitle,
      views: video.statistics ? parseInt(video.statistics.viewCount) : 0,
      likes: video.statistics ? parseInt(video.statistics.likeCount || '0') : 0,
      comments: video.statistics ? parseInt(video.statistics.commentCount || '0') : 0,
    },
  };
}

/**
 * Calculate engagement score for YouTube video
 */
export function calculateYouTubeScore(video: any): number {
  if (!video.statistics) return 0;

  const views = parseInt(video.statistics.viewCount || '0');
  const likes = parseInt(video.statistics.likeCount || '0');
  const comments = parseInt(video.statistics.commentCount || '0');

  // Engagement rate: (likes + comments) / views * 10000
  // Plus recency bonus
  const publishedDate = new Date(video.snippet.publishedAt);
  const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
  const recencyMultiplier = Math.max(0.1, 1 - (hoursAgo / 168)); // Decay over 7 days

  const engagementScore = ((likes + comments * 2) / Math.max(1, views / 1000)) * recencyMultiplier;

  return Math.round(engagementScore * 100);
}

/**
 * Fetch trending YouTube videos and convert to our format
 * 
 * @param categories - Array of YouTube category IDs
 */
export async function getTrendingYouTube(
  categories: string[] = ['0'] // 0 = all categories
): Promise<any[]> {
  const allVideos: any[] = [];

  for (const categoryId of categories) {
    const videos = await fetchTrendingVideos('US', categoryId === '0' ? undefined : categoryId, 15);
    const converted = videos.map(video => {
      const trending = convertYouTubeToTrending(video);
      return {
        ...trending,
        score: calculateYouTubeScore(video),
      };
    });
    allVideos.push(...converted);
  }

  // Sort by score and return top items
  return allVideos.sort((a, b) => b.score - a.score);
}

/**
 * YouTube Category IDs (for reference)
 * 
 * 1 - Film & Animation
 * 2 - Autos & Vehicles
 * 10 - Music
 * 15 - Pets & Animals
 * 17 - Sports
 * 20 - Gaming
 * 22 - People & Blogs
 * 23 - Comedy
 * 24 - Entertainment
 * 25 - News & Politics
 * 26 - Howto & Style
 * 27 - Education
 * 28 - Science & Technology
 */
