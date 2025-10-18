// src/app/api/posts/[id]/comments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Comment from "@/models/comment.model";
import Post from "@/models/post.model";
import { createNotification } from "@/utils/notifications";
import { notifyMentionedUsers } from "@/utils/mentions";

// GET - Get comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const comments = await Comment.getPostComments(id, page, limit);

    // Add isLiked flag for current user
    const commentsWithFlags = comments.map((comment: any) => ({
      ...comment,
      isLiked: comment.likes.some(
        (id: any) => id.toString() === userId
      ),
      likeCount: comment.likes.length,
    }));

    return NextResponse.json({
      success: true,
      comments: commentsWithFlags,
      page,
      hasMore: comments.length === limit,
    });
  } catch (error: any) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST - Create comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const { id } = await params;
    const body = await req.json();
    const { text, parentCommentId } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create comment
    const comment = await Comment.createComment({
      postId: id,
      userId: userId,
      text: text.trim(),
      parentCommentId: parentCommentId || undefined,
    });

    // Notify mentioned users in comment (async, non-blocking)
    notifyMentionedUsers(
      text.trim(),
      userId,
      id,
      (comment as any)._id.toString()
    ).catch(err => {
      console.error("Failed to notify mentioned users:", err);
    });

    // Create notification for comment (asynchronous, non-blocking)
    try {
      const notificationType = parentCommentId ? "REPLY" : "COMMENT";
      
      // Determine recipient: parent comment author for replies, post author for comments
      let recipientId = post.userId.toString();
      
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId).select('userId').lean();
        if (parentComment?.userId) {
          recipientId = parentComment.userId.toString();
        }
      }
      
      // Send notification asynchronously
      createNotification({
        recipientId,
        senderId: userId,
        type: notificationType,
        postId: id,
        commentId: (comment as any)._id.toString(),
        message: text.trim().substring(0, 100), // First 100 chars as preview
      }).catch(err => {
        console.error("Failed to create comment notification:", err);
      });
    } catch (notifError) {
      console.error("Error in comment notification flow:", notifError);
    }

    return NextResponse.json({
      success: true,
      comment: {
        ...comment.toObject(),
        isLiked: false,
        likeCount: 0,
      },
    });
  } catch (error: any) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    );
  }
}