/**
 * 🔍 Search History Model
 * 
 * Stores user search history for personalized recommendations
 * Auto-expires after 30 days
 * 
 * Features:
 * - User-specific search tracking
 * - Search frequency tracking
 * - Popular searches aggregation
 * - Automatic cleanup
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript interface for SearchHistory document
 */
export interface ISearchHistory extends Document {
  userId: mongoose.Types.ObjectId;  // User who performed the search
  query: string;                    // Search query text
  category?: string;                // Optional category filter
  resultCount: number;              // Number of results found
  clickedResults: string[];         // IDs of results user clicked
  searchedAt: Date;                 // When the search was performed
  expiresAt: Date;                  // Auto-delete after 30 days
}

/**
 * Mongoose schema for SearchHistory
 */
const SearchHistorySchema = new Schema<ISearchHistory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,  // Index for user-specific queries
  },
  query: {
    type: String,
    required: [true, 'Search query is required'],
    trim: true,
    maxlength: [200, 'Query cannot exceed 200 characters'],
    index: true,  // Index for popular searches
  },
  category: {
    type: String,
    enum: ['news', 'youtube', 'tech', 'crypto', 'entertainment', 'sports', 'politics', 'all'],
    default: 'all',
  },
  resultCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  clickedResults: [{
    type: String,
    trim: true,
  }],
  searchedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,  // TTL index
  },
}, {
  timestamps: true,
  collection: 'search_history',
});

/**
 * Compound index for user + date queries
 * Efficient for fetching user's recent searches
 */
SearchHistorySchema.index({ userId: 1, searchedAt: -1 });

/**
 * Compound index for popular searches
 */
SearchHistorySchema.index({ query: 1, searchedAt: -1 });

/**
 * TTL index - Auto-delete after 30 days
 */
SearchHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Pre-save middleware - Set default expiration
 */
SearchHistorySchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Expire after 30 days
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

/**
 * Static method to get user's recent searches
 */
SearchHistorySchema.statics.getUserRecentSearches = async function(
  userId: string, 
  limit: number = 10
) {
  return this.find({ userId })
    .sort({ searchedAt: -1 })
    .limit(limit)
    .select('query category searchedAt')
    .lean();
};

/**
 * Static method to get popular searches (trending searches)
 */
SearchHistorySchema.statics.getPopularSearches = async function(
  hours: number = 24,
  limit: number = 10
) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        searchedAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 },
        lastSearched: { $max: '$searchedAt' }
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
        lastSearched: 1
      }
    }
  ]);
};

/**
 * Static method to clear user's search history
 */
SearchHistorySchema.statics.clearUserHistory = async function(userId: string) {
  return this.deleteMany({ userId });
};

// Export the model
export default (mongoose.models.SearchHistory || 
  mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema)) as mongoose.Model<ISearchHistory>;
