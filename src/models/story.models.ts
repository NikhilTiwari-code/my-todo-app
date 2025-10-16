import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStory extends Document {
  userId: mongoose.Types.ObjectId;
  content?: string; // Optional text content
  imageUrl?: string; // Base64 image or URL
  type: "text" | "image" | "both";
  views: {
    userId: mongoose.Types.ObjectId;
    viewedAt: Date;
  }[];
  expiresAt: Date; // Auto-delete after 24 hours
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    imageUrl: {
      type: String, // Base64 string or cloud URL
    },
    type: {
      type: String,
      enum: ["text", "image", "both"],
      required: true,
    },
    views: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
      index: true, // For efficient cleanup queries
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active stories
StorySchema.index({ expiresAt: 1 });
StorySchema.index({ userId: 1, expiresAt: 1 });

// Static method to get active stories
StorySchema.statics.getActiveStories = async function () {
  return this.find({
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("userId", "name email avatar")
    .lean();
};

// Static method to get user's active stories
StorySchema.statics.getUserStories = async function (userId: string) {
  return this.find({
    userId,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
};

// Static method to delete expired stories
StorySchema.statics.deleteExpired = async function () {
  const result = await this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

export interface IStoryModel extends Model<IStory> {
  getActiveStories(): Promise<IStory[]>;
  getUserStories(userId: string): Promise<IStory[]>;
  deleteExpired(): Promise<number>;
}

export default (mongoose.models.Story ||
  mongoose.model<IStory, IStoryModel>("Story", StorySchema)) as IStoryModel;
