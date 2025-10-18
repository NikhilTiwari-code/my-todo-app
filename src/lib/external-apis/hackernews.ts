/**
 * 🟠 Hacker News API Integration
 * 
 * Fetches trending tech stories from Hacker News
 * Completely free, no API key required
 * 
 * @see https://github.com/HackerNews/API
 */

import axios from 'axios';

const HN_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

/**
 * Hacker News Story interface
 */
export interface HNStory {
  id: number;
  title: string;
  url?: string;
  text?: string;
  score: number;
  by: string;
  time: number;
  descendants: number; // Number of comments
  type: 'story' | 'job' | 'poll';
}

/**
 * Fetch top story IDs from Hacker News
 * 
 * @param type - Type: topstories, newstories, beststories
 * @param limit - Number of IDs to fetch
 */
async function fetchStoryIds(
  type: 'topstories' | 'newstories' | 'beststories' = 'topstories',
  limit: number = 30
): Promise<number[]> {
  try {
    const response = await axios.get(`${HN_BASE_URL}/${type}.json`, {
      timeout: 10000,
    });

    return response.data.slice(0, limit);
  } catch (error: any) {
    console.error('❌ Hacker News IDs fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch story details by ID
 * 
 * @param storyId - Story ID
 */
async function fetchStoryById(storyId: number): Promise<HNStory | null> {
  try {
    const response = await axios.get(`${HN_BASE_URL}/item/${storyId}.json`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error: any) {
    console.error(`❌ Story ${storyId} fetch error:`, error.message);
    return null;
  }
}

/**
 * Fetch multiple stories by their IDs
 * 
 * @param storyIds - Array of story IDs
 */
export async function fetchStories(storyIds: number[]): Promise<HNStory[]> {
  const stories: HNStory[] = [];

  // Fetch stories in parallel (batches of 10)
  const batchSize = 10;
  for (let i = 0; i < storyIds.length; i += batchSize) {
    const batch = storyIds.slice(i, i + batchSize);
    const batchPromises = batch.map(id => fetchStoryById(id));
    const batchResults = await Promise.all(batchPromises);
    
    stories.push(...batchResults.filter((story): story is HNStory => story !== null));
  }

  return stories;
}

/**
 * Fetch top stories from Hacker News
 * 
 * @param limit - Number of stories to fetch
 */
export async function fetchTopStories(limit: number = 20): Promise<HNStory[]> {
  const storyIds = await fetchStoryIds('topstories', limit);
  return fetchStories(storyIds);
}

/**
 * Fetch new stories from Hacker News
 * 
 * @param limit - Number of stories to fetch
 */
export async function fetchNewStories(limit: number = 20): Promise<HNStory[]> {
  const storyIds = await fetchStoryIds('newstories', limit);
  return fetchStories(storyIds);
}

/**
 * Fetch best stories from Hacker News
 * 
 * @param limit - Number of stories to fetch
 */
export async function fetchBestStories(limit: number = 20): Promise<HNStory[]> {
  const storyIds = await fetchStoryIds('beststories', limit);
  return fetchStories(storyIds);
}

/**
 * Convert Hacker News story to TrendingTopic format
 */
export function convertHNToTrending(story: HNStory) {
  return {
    title: story.title,
    category: 'tech',
    source: 'HackerNews',
    url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
    imageUrl: undefined, // HN doesn't provide images
    description: story.text?.substring(0, 200) || undefined,
    publishedAt: new Date(story.time * 1000),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      author: story.by,
      comments: story.descendants || 0,
    },
  };
}

/**
 * Calculate engagement score for HN story
 * HN's algorithm: score / (age_in_hours + 2)^1.8
 */
export function calculateHNScore(story: HNStory): number {
  const hoursAge = (Date.now() - story.time * 1000) / (1000 * 60 * 60);
  const gravity = 1.8;
  
  // HN-style score with comment weight
  const score = story.score || 0;
  const commentBonus = (story.descendants || 0) * 0.5;
  
  const hnScore = (score + commentBonus) / Math.pow(hoursAge + 2, gravity);
  
  return Math.round(hnScore * 100);
}

/**
 * Fetch trending Hacker News stories and convert to our format
 */
export async function getTrendingHackerNews(): Promise<any[]> {
  const stories = await fetchTopStories(25);
  
  return stories
    .map(story => {
      const trending = convertHNToTrending(story);
      return {
        ...trending,
        score: calculateHNScore(story),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Search Hacker News using Algolia API
 * 
 * @param query - Search query
 * @param tags - Optional tags: story, comment, poll, show_hn, ask_hn
 */
export async function searchHackerNews(
  query: string,
  tags: string = 'story',
  hitsPerPage: number = 20
): Promise<any[]> {
  try {
    const response = await axios.get('https://hn.algolia.com/api/v1/search', {
      params: {
        query,
        tags,
        hitsPerPage,
      },
      timeout: 10000,
    });

    return response.data.hits.map((hit: any) => ({
      id: hit.objectID,
      title: hit.title || hit.story_title,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      score: hit.points || 0,
      by: hit.author,
      time: new Date(hit.created_at).getTime() / 1000,
      descendants: hit.num_comments || 0,
      type: 'story',
    }));
  } catch (error: any) {
    console.error('❌ HN search error:', error.message);
    return [];
  }
}
