// 📸 Post Model - Instagram-style posts with images, likes, comments
// MongoDB schema for Feed Posts


// src/models/post.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  caption?: string;
  images: string[]; // Cloudinary URLs
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  likes: mongoose.Types.ObjectId[]; // Array of user IDs who liked
  commentCount: number; // Denormalized for performance
  savedBy: mongoose.Types.ObjectId[]; // Users who saved this post
  shareCount: number; // Number of times shared
  hashtags: string[]; // Extracted from caption
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    caption: {
      type: String,
      maxlength: 2200, // Instagram's limit
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length >= 1 && v.length <= 10;
        },
        message: "Post must have between 1 and 10 images",
      },
    },
    location: {
      name: String,
      latitude: Number,
      longitude: Number,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    commentCount: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    shareCount: {
      type: Number,
      default: 0,
      index: true, // For "most shared" queries
    },
    hashtags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
PostSchema.index({ userId: 1, createdAt: -1 }); // User's posts
PostSchema.index({ createdAt: -1 }); // Feed sorting
PostSchema.index({ hashtags: 1 }); // Hashtag search
PostSchema.index({ "likes": 1 }); // Check if user liked
PostSchema.index({ "savedBy": 1 }); // Check if user saved

// Virtual for like count
PostSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Extract hashtags from caption before saving
PostSchema.pre("save", function (next) {
  if (this.isModified("caption") && this.caption) {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    this.hashtags = (this.caption.match(hashtagRegex) || []).map((tag) =>
      tag.toLowerCase()
    );
  }
  next();
});

// Static Methods

// Get feed for a user (posts from people they follow)
PostSchema.statics.getFeed = async function (
  userId: string,
  followingIds: string[],
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  return this.find({
    userId: { $in: [...followingIds, userId] }, // Include own posts
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name username avatar")
    .lean();
};

// Get user's posts
PostSchema.statics.getUserPosts = async function (
  userId: string,
  page: number = 1,
  limit: number = 12
) {
  const skip = (page - 1) * limit;

  return this.find({
    userId,
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Get single post with details
PostSchema.statics.getPostById = async function (postId: string) {
  return this.findById(postId)
    .populate("userId", "name username avatar")
    .populate({
      path: "likes",
      select: "name username avatar",
      options: { limit: 50 }, // Show first 50 likes
    })
    .lean();
};

// Toggle like on post
PostSchema.statics.toggleLike = async function (
  postId: string,
  userId: string
) {
  const post = await this.findById(postId);
  if (!post) throw new Error("Post not found");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const likeIndex = post.likes.findIndex((id: any) => id.equals(userObjectId));

  if (likeIndex > -1) {
    // Unlike
    post.likes.splice(likeIndex, 1);
  } else {
    // Like
    post.likes.push(userObjectId);
  }

  await post.save();
  return {
    isLiked: likeIndex === -1,
    likeCount: post.likes.length,
  };
};

// Toggle save post
PostSchema.statics.toggleSave = async function (
  postId: string,
  userId: string
) {
  const post = await this.findById(postId);
  if (!post) throw new Error("Post not found");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const saveIndex = post.savedBy.findIndex((id: any) => id.equals(userObjectId));

  if (saveIndex > -1) {
    // Unsave
    post.savedBy.splice(saveIndex, 1);
  } else {
    // Save
    post.savedBy.push(userObjectId);
  }

  await post.save();
  return {
    isSaved: saveIndex === -1,
  };
};

// Get saved posts for user
PostSchema.statics.getSavedPosts = async function (
  userId: string,
  page: number = 1,
  limit: number = 12
) {
  const skip = (page - 1) * limit;

  return this.find({
    savedBy: userId,
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name username avatar")
    .lean();
};

// Increment comment count
PostSchema.statics.incrementCommentCount = async function (postId: string) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { commentCount: 1 } },
    { new: true }
  );
};

// Decrement comment count
PostSchema.statics.decrementCommentCount = async function (postId: string) {
  return this.findByIdAndUpdate(
    postId,
    { $inc: { commentCount: -1 } },
    { new: true }
  );
};

// Check if user has liked post
PostSchema.methods.isLikedBy = function (userId: string): boolean {
  return this.likes.some((id: any) => id.toString() === userId);
};

// Check if user has saved post
PostSchema.methods.isSavedBy = function (userId: string): boolean {
  return this.savedBy.some((id: any) => id.toString() === userId);
};

// Interface for static methods
export interface IPostModel extends Model<IPost> {
  getFeed(
    userId: string,
    followingIds: string[],
    page?: number,
    limit?: number
  ): Promise<IPost[]>;
  getUserPosts(userId: string, page?: number, limit?: number): Promise<IPost[]>;
  getPostById(postId: string): Promise<IPost | null>;
  toggleLike(postId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }>;
  toggleSave(postId: string, userId: string): Promise<{ isSaved: boolean }>;
  getSavedPosts(userId: string, page?: number, limit?: number): Promise<IPost[]>;
  incrementCommentCount(postId: string): Promise<IPost | null>;
  decrementCommentCount(postId: string): Promise<IPost | null>;
}

export default (mongoose.models.Post ||
  mongoose.model<IPost, IPostModel>("Post", PostSchema)) as IPostModel;