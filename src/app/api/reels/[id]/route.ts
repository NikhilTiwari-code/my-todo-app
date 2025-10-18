// 📍 PASTE YOUR SINGLE REEL API CODE HERE
// GET: Fetch specific reel
// DELETE: Delete reel

import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Reel from "@/models/reel.models";
import { getUserIdFromRequest } from "@/utils/auth";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDb();

    const { id } = await params;
    const userId = await getUserIdFromRequest(request);

    const reel = await Reel.findById(id)
      .populate("userId", "name avatar username")
      .populate("likes", "name avatar username")
      .populate("comments.userId", "name avatar username");

    if (!reel || !reel.isActive) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    // Increment view count (but not for the owner)
    const userIdStr = typeof userId === 'string' ? userId : null;
    if (userIdStr && userIdStr !== (reel.userId as any)._id.toString()) {
      await Reel.findByIdAndUpdate(id, { $inc: { views: 1 } });
      reel.views += 1;
    }

    const formattedReel = {
      _id: reel._id,
      user: {
        _id: (reel.userId as any)._id,
        name: (reel.userId as any).name,
        avatar: (reel.userId as any).avatar,
        username: (reel.userId as any).username,
      },
      videoUrl: reel.videoUrl,
      thumbnailUrl: reel.thumbnailUrl,
      caption: reel.caption,
      duration: reel.duration,
      views: reel.views,
      likes: reel.likes.map((like: any) => ({
        _id: like._id,
        name: like.name,
        avatar: like.avatar,
        username: like.username,
      })),
      likesCount: reel.likes.length,
      comments: reel.comments,
      commentsCount: reel.comments.length,
      hashtags: reel.hashtags,
      music: reel.music,
      isLiked: userId ? reel.likes.some((like: any) => like._id.toString() === userId.toString()) : false,
      createdAt: reel.createdAt,
    };

    return NextResponse.json({ reel: formattedReel });

  } catch (error) {
    console.error("GET single reel error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDb();

    const { id } = await params;
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const reel = await Reel.findById(id);

    if (!reel) {
      return NextResponse.json(
        { error: "Reel not found" },
        { status: 404 }
      );
    }

    // Check if user owns the reel
    const userIdStr = typeof userId === 'string' ? userId : null;
    if ((reel.userId as any).toString() !== userIdStr) {
      return NextResponse.json(
        { error: "Unauthorized to delete this reel" },
        { status: 403 }
      );
    }

    // Soft delete the reel
    await Reel.findByIdAndUpdate(id, { isActive: false });

    // Optionally delete from Cloudinary (uncomment if you want to delete the actual video)
    // try {
    //   await deleteFromCloudinary(reel.cloudinaryPublicId);
    // } catch (cloudinaryError) {
    //   console.error("Failed to delete from Cloudinary:", cloudinaryError);
    //   // Don't fail the request if Cloudinary deletion fails
    // }

    return NextResponse.json({ message: "Reel deleted successfully" });

  } catch (error) {
    console.error("DELETE reel error:", error);
    return NextResponse.json(
      { error: "Failed to delete reel" },
      { status: 500 }
    );
  }
}
