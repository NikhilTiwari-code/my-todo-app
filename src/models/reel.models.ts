// 📍 PASTE YOUR REEL MODEL HERE
// MongoDB schema for Reels

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReel extends Document {
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  views: number;
  likes: mongoose.Types.ObjectId[];
  comments: Array<{
    userId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  hashtags: string[];
  music?: string;
  cloudinaryPublicId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReelSchema: Schema<IReel> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      maxlength: 2200,
      default: "",
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
      max: 60, // Max 60 seconds
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    comments: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      text: {
        type: String,
        required: true,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    hashtags: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    music: {
      type: String,
      default: "",
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
ReelSchema.index({ createdAt: -1 }); // For feed sorting
ReelSchema.index({ userId: 1, createdAt: -1 }); // For user's reels
ReelSchema.index({ hashtags: 1 }); // For hashtag discovery
ReelSchema.index({ likes: 1 }); // For trending
ReelSchema.index({ "comments.userId": 1 }); // For comment queries

// Virtual for likes count
ReelSchema.virtual("likesCount").get(function() {
  return this.likes.length;
});

// Virtual for comments count
ReelSchema.virtual("commentsCount").get(function() {
  return this.comments.length;
});

// Pre-save middleware to extract hashtags from caption
ReelSchema.pre("save", function(next) {
  if (this.isModified("caption")) {
    // Extract hashtags from caption
    const hashtagRegex = /#(\w+)/g;
    const hashtags: string[] = [];
    let match;

    while ((match = hashtagRegex.exec(this.caption)) !== null) {
      hashtags.push(match[1].toLowerCase());
    }

    this.hashtags = [...new Set(hashtags)]; // Remove duplicates
  }
  next();
});

const Reel: Model<IReel> = mongoose.models.Reel || mongoose.model<IReel>("Reel", ReelSchema);

export default Reel;
