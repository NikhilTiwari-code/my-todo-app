// src/app/api/posts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";
import Comment from "@/models/comment.model";
import {
  deleteMultipleFromCloudinary,
  getPublicIdFromUrl,
} from "@/lib/cloudinary";

// GET - Get single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const post = await Post.getPostById(params.id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Add flags for current user
    const postWithFlags = {
      ...post,
      isLiked: (post as any).likes.some(
        (id: any) => id.toString() === userId
      ),
      isSaved: (post as any).savedBy.some(
        (id: any) => id.toString() === userId
      ),
      likeCount: (post as any).likes.length,
    };

    return NextResponse.json({
      success: true,
      post: postWithFlags,
    });
  } catch (error: any) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// DELETE - Delete post (only owner)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership
    if (post.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all comments for this post
    await Comment.deleteMany({ postId: params.id });

    // Delete images from Cloudinary
    try {
      const publicIds = post.images.map((url: string) => getPublicIdFromUrl(url));
      await deleteMultipleFromCloudinary(publicIds);
    } catch (cloudinaryError) {
      console.error("Failed to delete images from Cloudinary:", cloudinaryError);
      // Continue with post deletion even if Cloudinary fails
    }

    // Delete post
    await post.deleteOne();

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete post" },
      { status: 500 }
    );
  }
}

// PATCH - Update post (caption only, owner only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check ownership
    if (post.userId.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { caption } = body;

    if (caption !== undefined) {
      post.caption = caption.trim();
      await post.save();
    }

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update post" },
      { status: 500 }
    );
  }
}
