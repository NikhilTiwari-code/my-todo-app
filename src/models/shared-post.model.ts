import mongoose, { Schema, Document } from "mongoose";

export interface ISharedPost extends Document {
  sender: mongoose.Types.ObjectId;    // User who shared
  recipient: mongoose.Types.ObjectId; // User receiving
  
  // What was shared (only one will be populated)
  post?: mongoose.Types.ObjectId;
  reel?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  
  // Optional message from sender
  message?: string;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const sharedPostSchema = new Schema<ISharedPost>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup for inbox
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    reel: {
      type: Schema.Types.ObjectId,
      ref: "Reel",
    },
    story: {
      type: Schema.Types.ObjectId,
      ref: "Story",
    },
    message: {
      type: String,
      maxlength: 500, // Optional note (500 chars max)
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
sharedPostSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
sharedPostSchema.index({ sender: 1, createdAt: -1 });

// Auto-delete read shared posts after 30 days
sharedPostSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, 
    partialFilterExpression: { isRead: true } 
  }
);

export default mongoose.models.SharedPost || 
  mongoose.model<ISharedPost>("SharedPost", sharedPostSchema);
