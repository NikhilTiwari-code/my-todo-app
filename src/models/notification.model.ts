import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User receiving notification
  sender: mongoose.Types.ObjectId;    // User who triggered action
  type: "LIKE" | "COMMENT" | "FOLLOW" | "MENTION" | "REPLY" | "STORY_VIEW" | "POST_TAG" | "NEW_POST" | "SHARE";
  
  // Related content (optional, depends on type)
  post?: mongoose.Types.ObjectId;
  reel?: mongoose.Types.ObjectId;
  story?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  
  // Message preview (for comments/replies)
  message?: string;
  
  // Status
  isRead: boolean;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Fast lookup by recipient
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["LIKE", "COMMENT", "FOLLOW", "MENTION", "REPLY", "STORY_VIEW", "POST_TAG", "NEW_POST", "SHARE"],
      required: true,
      index: true,
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
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
    },
    message: {
      type: String,
      maxlength: 200, // Preview text
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Fast filtering of unread
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Auto-delete old read notifications (after 30 days)
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { isRead: true } }
);

export default mongoose.models.Notification || 
  mongoose.model<INotification>("Notification", notificationSchema);
