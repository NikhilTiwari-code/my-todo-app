/**
 * #️⃣ Hashtag Statistics Model
 * 
 * Tracks hashtag usage and engagement for internal trending calculation
 * Updates in real-time as posts are created
 * 
 * Features:
 * - Real-time hashtag tracking
 * - Engagement scoring
 * - Time-decay algorithm
 * - Category classification
 */

import mongoose, { Schema, Document } from 'mongoose';

/**
 * TypeScript interface for HashtagStats document
 */
export interface IHashtagStats extends Document {
  hashtag: string;                  // Hashtag without # symbol
  category?: string;                // Auto-detected or manual category
  postCount: number;                // Total posts with this hashtag
  todayCount: number;               // Posts today (resets daily)
  weekCount: number;                // Posts this week
  totalEngagement: number;          // Sum of likes + comments + shares
  avgEngagement: number;            // Average engagement per post
  trendingScore: number;            // Calculated trending score (0-100)
  peakDate: Date;                   // When it was most popular
  lastUsed: Date;                   // Last time it was used
  firstUsed: Date;                  // When it first appeared
  relatedHashtags: string[];        // Frequently co-occurring hashtags
  updatedAt: Date;
}

/**
 * Mongoose schema for HashtagStats
 */
const HashtagStatsSchema = new Schema<IHashtagStats>({
  hashtag: {
    type: String,
    required: [true, 'Hashtag is required'],
    unique: true,
    lowercase: true,                // Store in lowercase for consistency
    trim: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['news', 'youtube', 'tech', 'crypto', 'entertainment', 'sports', 'politics', 'general'],
    default: 'general',
    index: true,
  },
  postCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  todayCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  weekCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalEngagement: {
    type: Number,
    default: 0,
    min: 0,
  },
  avgEngagement: {
    type: Number,
    default: 0,
    min: 0,
  },
  trendingScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
    index: true,  // Index for sorting by trending score
  },
  peakDate: {
    type: Date,
    default: Date.now,
  },
  lastUsed: {
    type: Date,
    default: Date.now,
    index: true,
  },
  firstUsed: {
    type: Date,
    default: Date.now,
  },
  relatedHashtags: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
}, {
  timestamps: true,
  collection: 'hashtag_stats',
});

/**
 * Compound index for category + trending score queries
 * Used for category-specific trending hashtags
 */
HashtagStatsSchema.index({ category: 1, trendingScore: -1 });

/**
 * Compound index for trending score + last used
 * Used for overall trending hashtags with recency
 */
HashtagStatsSchema.index({ trendingScore: -1, lastUsed: -1 });

/**
 * Pre-save middleware - Calculate trending score
 * Algorithm considers:
 * - Recent activity (todayCount, weekCount)
 * - Engagement rate (avgEngagement)
 * - Velocity (growth rate)
 * - Recency (time since last used)
 */
HashtagStatsSchema.pre('save', function(next) {
  // Calculate average engagement
  if (this.postCount > 0) {
    this.avgEngagement = this.totalEngagement / this.postCount;
  }

  // Calculate trending score (0-100)
  // Formula: (todayWeight * todayCount) + (weekWeight * weekCount) + (engagementWeight * avgEngagement) - (recencyPenalty)
  const todayWeight = 10;
  const weekWeight = 2;
  const engagementWeight = 0.5;
  
  const baseScore = 
    (todayWeight * this.todayCount) +
    (weekWeight * this.weekCount) +
    (engagementWeight * this.avgEngagement);
  
  // Apply recency decay (reduce score if not used recently)
  const hoursSinceLastUse = (Date.now() - this.lastUsed.getTime()) / (1000 * 60 * 60);
  const recencyFactor = Math.max(0, 1 - (hoursSinceLastUse / 168)); // Decay over 7 days
  
  this.trendingScore = Math.min(100, baseScore * recencyFactor);
  
  // Update peak date if this is a new peak
  if (this.todayCount > 0 && (!this.peakDate || this.todayCount > this.todayCount)) {
    this.peakDate = new Date();
  }
  
  next();
});

/**
 * Static method to increment hashtag usage
 * Called when a new post with this hashtag is created
 */
HashtagStatsSchema.statics.incrementUsage = async function(
  hashtag: string,
  engagement: number = 0,
  relatedHashtags: string[] = []
) {
  const cleanHashtag = hashtag.toLowerCase().replace('#', '');
  
  return this.findOneAndUpdate(
    { hashtag: cleanHashtag },
    {
      $inc: {
        postCount: 1,
        todayCount: 1,
        weekCount: 1,
        totalEngagement: engagement,
      },
      $set: {
        lastUsed: new Date(),
      },
      $addToSet: {
        relatedHashtags: { $each: relatedHashtags.map(h => h.toLowerCase().replace('#', '')) }
      },
      $setOnInsert: {
        firstUsed: new Date(),
      }
    },
    {
      upsert: true,
      new: true,
    }
  );
};

/**
 * Static method to get trending hashtags
 */
HashtagStatsSchema.statics.getTrending = async function(
  category?: string,
  limit: number = 10
) {
  const query = category ? { category } : {};
  
  return this.find(query)
    .sort({ trendingScore: -1, lastUsed: -1 })
    .limit(limit)
    .select('hashtag category trendingScore postCount todayCount avgEngagement')
    .lean();
};

/**
 * Static method to reset daily counters (called by cron job)
 */
HashtagStatsSchema.statics.resetDailyCounters = async function() {
  return this.updateMany(
    {},
    { $set: { todayCount: 0 } }
  );
};

/**
 * Static method to reset weekly counters (called by cron job)
 */
HashtagStatsSchema.statics.resetWeeklyCounters = async function() {
  return this.updateMany(
    {},
    { $set: { weekCount: 0 } }
  );
};

/**
 * Static method to search hashtags
 */
HashtagStatsSchema.statics.searchHashtags = async function(
  query: string,
  limit: number = 10
) {
  return this.find({
    hashtag: { $regex: query, $options: 'i' }
  })
    .sort({ trendingScore: -1 })
    .limit(limit)
    .select('hashtag category postCount trendingScore')
    .lean();
};

// Export the model
export default (mongoose.models.HashtagStats || 
  mongoose.model<IHashtagStats>('HashtagStats', HashtagStatsSchema)) as mongoose.Model<IHashtagStats>;
