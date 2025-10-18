// src/models/comment.model.ts

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  text: string;
  likes: mongoose.Types.ObjectId[];
  parentCommentId?: mongoose.Types.ObjectId; // For replies
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CommentSchema.index({ postId: 1, createdAt: -1 }); // Get post comments
CommentSchema.index({ parentCommentId: 1 }); // Get replies
CommentSchema.index({ userId: 1 }); // User's comments

// Virtual for like count
CommentSchema.virtual("likeCount").get(function () {
  return this.likes.length;
});

// Static Methods

// Get comments for a post (top-level only, no replies)
CommentSchema.statics.getPostComments = async function (
  postId: string,
  page: number = 1,
  limit: number = 20
) {
  const skip = (page - 1) * limit;

  return this.find({
    postId,
    parentCommentId: null, // Only top-level comments
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("userId", "name username avatar")
    .lean();
};

// Get replies for a comment
CommentSchema.statics.getReplies = async function (
  commentId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  return this.find({
    parentCommentId: commentId,
  })
    .sort({ createdAt: 1 }) // Oldest first for replies
    .skip(skip)
    .limit(limit)
    .populate("userId", "name username avatar")
    .lean();
};

// Create comment
CommentSchema.statics.createComment = async function (data: {
  postId: string;
  userId: string;
  text: string;
  parentCommentId?: string;
}) {
  const comment = await this.create(data);

  // Import Post model dynamically to avoid circular dependency
  const Post = mongoose.model("Post") as any;
  
  // Increment post comment count
  await Post.incrementCommentCount(data.postId);

  // If it's a reply, increment parent comment reply count
  if (data.parentCommentId) {
    await this.findByIdAndUpdate(data.parentCommentId, {
      $inc: { replyCount: 1 },
    });
  }

  return comment.populate("userId", "name username avatar");
};

// Delete comment
CommentSchema.statics.deleteComment = async function (commentId: string) {
  const comment = await this.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  const Post = mongoose.model("Post") as any;

  // Delete all replies first
  const replies = await this.find({ parentCommentId: commentId });
  await this.deleteMany({ parentCommentId: commentId });

  // Decrement post comment count (1 + number of replies)
  const totalDeleted = 1 + replies.length;
  for (let i = 0; i < totalDeleted; i++) {
    await Post.decrementCommentCount(comment.postId.toString());
  }

  // If it's a reply, decrement parent comment reply count
  if (comment.parentCommentId) {
    await this.findByIdAndUpdate(comment.parentCommentId, {
      $inc: { replyCount: -1 },
    });
  }

  await comment.deleteOne();
  return { deletedCount: totalDeleted };
};

// Toggle like on comment
CommentSchema.statics.toggleLike = async function (
  commentId: string,
  userId: string
) {
  const comment = await this.findById(commentId);
  if (!comment) throw new Error("Comment not found");

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const likeIndex = comment.likes.findIndex((id: any) => id.equals(userObjectId));

  if (likeIndex > -1) {
    // Unlike
    comment.likes.splice(likeIndex, 1);
  } else {
    // Like
    comment.likes.push(userObjectId);
  }

  await comment.save();
  return {
    isLiked: likeIndex === -1,
    likeCount: comment.likes.length,
  };
};

// Get comment count for post
CommentSchema.statics.getCommentCount = async function (postId: string) {
  return this.countDocuments({ postId });
};

// Check if user has liked comment
CommentSchema.methods.isLikedBy = function (userId: string): boolean {
  return this.likes.some((id: any) => id.toString() === userId);
};

// Interface for static methods
export interface ICommentModel extends Model<IComment> {
  getPostComments(postId: string, page?: number, limit?: number): Promise<IComment[]>;
  getReplies(commentId: string, page?: number, limit?: number): Promise<IComment[]>;
  createComment(data: {
    postId: string;
    userId: string;
    text: string;
    parentCommentId?: string;
  }): Promise<IComment>;
  deleteComment(commentId: string): Promise<{ deletedCount: number }>;
  toggleLike(commentId: string, userId: string): Promise<{ isLiked: boolean; likeCount: number }>;
  getCommentCount(postId: string): Promise<number>;
}

export default (mongoose.models.Comment ||
  mongoose.model<IComment, ICommentModel>("Comment", CommentSchema)) as ICommentModel;