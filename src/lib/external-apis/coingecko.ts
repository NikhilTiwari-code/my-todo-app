/**
 * 🪙 CoinGecko API Integration
 * 
 * Fetches trending cryptocurrencies and market data
 * Free tier: 10-50 calls/minute (no API key required)
 * 
 * @see https://www.coingecko.com/api/documentation
 */

import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

/**
 * CoinGecko Coin interface
 */
export interface CoinGeckoCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  market_cap_change_percentage_24h: number;
  total_volume: number;
}

/**
 * Trending Coin interface
 */
export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
  };
}

/**
 * Fetch trending coins (top 7 searched coins in last 24h)
 */
export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search/trending`, {
      timeout: 10000,
    });

    return response.data.coins || [];
  } catch (error: any) {
    console.error('❌ CoinGecko trending fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch top cryptocurrencies by market cap
 * 
 * @param vs_currency - Currency: usd, eur, etc.
 * @param order - Sort order: market_cap_desc, volume_desc, etc.
 * @param per_page - Number of results (max 250)
 * @param page - Page number
 */
export async function fetchTopCoins(
  vs_currency: string = 'usd',
  order: string = 'market_cap_desc',
  per_page: number = 50,
  page: number = 1
): Promise<CoinGeckoCoin[]> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
      params: {
        vs_currency,
        order,
        per_page,
        page,
        sparkline: false,
        price_change_percentage: '24h',
      },
      timeout: 10000,
    });

    return response.data || [];
  } catch (error: any) {
    console.error('❌ CoinGecko markets fetch error:', error.message);
    return [];
  }
}

/**
 * Fetch coin details by ID
 * 
 * @param coinId - Coin ID (e.g., 'bitcoin', 'ethereum')
 */
export async function fetchCoinDetails(coinId: string): Promise<any> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: true,
        developer_data: false,
      },
      timeout: 10000,
    });

    return response.data;
  } catch (error: any) {
    console.error(`❌ CoinGecko coin ${coinId} fetch error:`, error.message);
    return null;
  }
}

/**
 * Search coins by query
 * 
 * @param query - Search query
 */
export async function searchCoins(query: string): Promise<any[]> {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
      params: { query },
      timeout: 10000,
    });

    return response.data.coins || [];
  } catch (error: any) {
    console.error('❌ CoinGecko search error:', error.message);
    return [];
  }
}

/**
 * Convert trending coin to TrendingTopic format
 */
export function convertTrendingCoinToTrending(coin: TrendingCoin) {
  const item = coin.item;
  
  return {
    title: `${item.name} (${item.symbol.toUpperCase()}) - Trending #${item.market_cap_rank || 'N/A'}`,
    category: 'crypto',
    source: 'CoinGecko',
    url: `https://www.coingecko.com/en/coins/${item.id}`,
    imageUrl: item.large || item.thumb,
    description: `${item.name} is trending on CoinGecko with a market cap rank of ${item.market_cap_rank || 'N/A'}.`,
    publishedAt: new Date(),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      author: 'CoinGecko',
    },
  };
}

/**
 * Convert market coin to TrendingTopic format
 */
export function convertMarketCoinToTrending(coin: CoinGeckoCoin) {
  const priceChange = coin.price_change_percentage_24h?.toFixed(2) || '0';
  const direction = parseFloat(priceChange) >= 0 ? '📈' : '📉';
  
  return {
    title: `${coin.name} (${coin.symbol.toUpperCase()}) ${direction} ${priceChange}%`,
    category: 'crypto',
    source: 'CoinGecko',
    url: `https://www.coingecko.com/en/coins/${coin.id}`,
    imageUrl: coin.image,
    description: `Rank #${coin.market_cap_rank} | $${coin.current_price.toLocaleString()} | Volume: $${coin.total_volume.toLocaleString()}`,
    publishedAt: new Date(),
    fetchedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    metadata: {
      author: 'CoinGecko',
    },
  };
}

/**
 * Calculate engagement score for crypto
 * Based on price change and volume
 */
export function calculateCryptoScore(coin: CoinGeckoCoin): number {
  // Factors: price change %, volume, market cap rank
  const priceChangeWeight = Math.abs(coin.price_change_percentage_24h || 0) * 10;
  const volumeWeight = Math.log10(coin.total_volume || 1) * 5;
  const rankBonus = coin.market_cap_rank ? (100 - coin.market_cap_rank) : 0;
  
  return Math.round(priceChangeWeight + volumeWeight + rankBonus);
}

/**
 * Fetch trending cryptocurrencies and convert to our format
 */
export async function getTrendingCrypto(): Promise<any[]> {
  const trendingCoins = await fetchTrendingCoins();
  const marketCoins = await fetchTopCoins('usd', 'volume_desc', 20);
  
  // Convert trending coins
  const trendingConverted = trendingCoins.map(coin => {
    const trending = convertTrendingCoinToTrending(coin);
    return {
      ...trending,
      score: coin.item.score || 50,
    };
  });
  
  // Convert market coins and calculate scores
  const marketConverted = marketCoins
    .filter(coin => Math.abs(coin.price_change_percentage_24h) > 5) // Only significant moves
    .map(coin => {
      const trending = convertMarketCoinToTrending(coin);
      return {
        ...trending,
        score: calculateCryptoScore(coin),
      };
    });
  
  // Combine and sort by score
  return [...trendingConverted, ...marketConverted]
    .sort((a, b) => b.score - a.score)
    .slice(0, 30); // Top 30
}

/**
 * Get gainers and losers
 */
export async function getGainersAndLosers() {
  const coins = await fetchTopCoins('usd', 'market_cap_desc', 100);
  
  const gainers = coins
    .filter(c => c.price_change_percentage_24h > 0)
    .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
    .slice(0, 10);
  
  const losers = coins
    .filter(c => c.price_change_percentage_24h < 0)
    .sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h)
    .slice(0, 10);
  
  return { gainers, losers };
}
