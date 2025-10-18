/**
 * 🔥 Trending Topic Model
 * 
 * Stores trending topics fetched from external APIs (NewsAPI, YouTube, Reddit, etc.)
 * Auto-expires after 24 hours using MongoDB TTL index
 * 
 * Features:
 * - Ranking system (1-50)
 * - Category-based filtering
 * - Engagement metrics tracking
 * - Automatic expiration
 * 
 * @author Your Name
 * @version 1.0.0
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript interface for TrendingTopic document
 */
export interface ITrendingTopic extends Document {
  title: string;                    // Topic title (e.g., "Breaking: Election Results")
  category: string;                 // Category (news, tech, youtube, crypto, etc.)
  source: string;                   // Data source (NewsAPI, Reddit, YouTube, etc.)
  url: string;                      // External link to the content
  imageUrl?: string;                // Thumbnail/preview image
  description?: string;             // Brief description/snippet
  score: number;                    // Calculated trending score
  rank: number;                     // Current ranking position (1-50)
  publishedAt: Date;                // Original publication date
  fetchedAt: Date;                  // When we fetched this data
  expiresAt: Date;                  // Auto-delete after this date (24h)
  metadata?: {                      // Additional engagement metrics
    author?: string;                // Content author/creator
    views?: number;                 // View count
    likes?: number;                 // Like count
    comments?: number;              // Comment count
  };
}

/**
 * Mongoose schema for TrendingTopic
 * Includes validation, indexes, and TTL for auto-cleanup
 */
const TrendingTopicSchema = new Schema<ITrendingTopic>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
    index: true,  // Index for text search
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['news', 'youtube', 'tech', 'crypto', 'entertainment', 'sports', 'politics'],
      message: '{VALUE} is not a valid category'
    },
    index: true,  // Index for category filtering
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: ['NewsAPI', 'YouTube', 'Reddit', 'HackerNews', 'CoinGecko', 'Internal'],
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  imageUrl: {
    type: String,
    trim: true,
    default: null,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null,
  },
  score: {
    type: Number,
    default: 0,
    min: [0, 'Score cannot be negative'],
    index: true,  // Index for sorting by score
  },
  rank: {
    type: Number,
    default: 0,
    min: [0, 'Rank cannot be negative'],
    index: true,  // Index for sorting by rank
  },
  publishedAt: {
    type: Date,
    required: [true, 'Published date is required'],
    index: true,
  },
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true,  // TTL index for auto-cleanup
  },
  metadata: {
    author: {
      type: String,
      trim: true,
    },
    views: {
      type: Number,
      min: 0,
      default: 0,
    },
    likes: {
      type: Number,
      min: 0,
      default: 0,
    },
    comments: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
}, {
  timestamps: true,  // Adds createdAt and updatedAt automatically
  collection: 'trending_topics',
});

/**
 * Compound index for efficient category + rank queries
 * Used when fetching trending by category
 */
TrendingTopicSchema.index({ category: 1, rank: 1 });

/**
 * Compound index for category + score queries
 * Used for sorting within categories
 */
TrendingTopicSchema.index({ category: 1, score: -1 });

/**
 * TTL (Time To Live) index
 * MongoDB automatically deletes documents where expiresAt < current time
 * expireAfterSeconds: 0 means delete immediately when expiresAt is reached
 */
TrendingTopicSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Text index for full-text search on title and description
 * Enables MongoDB text search capabilities
 */
TrendingTopicSchema.index({ title: 'text', description: 'text' });

/**
 * Pre-save middleware
 * - Ensures URLs have proper protocol
 * - Sets default expiration if not provided
 */
TrendingTopicSchema.pre('save', function(next) {
  // Ensure URL has protocol
  if (this.url && !this.url.startsWith('http')) {
    this.url = 'https://' + this.url;
  }
  
  // Set default expiration (24 hours from now)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

/**
 * Static method to get trending by category
 */
TrendingTopicSchema.statics.getTrendingByCategory = async function(category: string, limit: number = 10) {
  return this.find({ category })
    .sort({ rank: 1 })
    .limit(limit)
    .lean();
};

/**
 * Static method to search trending topics
 */
TrendingTopicSchema.statics.searchTopics = async function(query: string, limit: number = 20) {
  return this.find(
    { $text: { $search: query } }
  )
    .sort({ trendingScore: -1 })
    .limit(limit)
    .lean();
};

// Export the model
export default (mongoose.models.TrendingTopic || 
  mongoose.model<ITrendingTopic>('TrendingTopic', TrendingTopicSchema)) as mongoose.Model<ITrendingTopic>;
