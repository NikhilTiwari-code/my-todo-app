import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import { getServerSession } from "@/utils/auth";

// POST - Upload avatar (for now, using base64 or URL)
// You can integrate Cloudinary or AWS S3 later
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { avatar, bio } = body;

    await connectToDb();

    const updateData: any = {};
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            followersCount: user.followers.length,
            followingCount: user.following.length
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update profile" } },
      { status: 500 }
    );
  }
}

// GET - Get current user profile with follow stats
export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please login" } },
        { status: 401 }
      );
    }

    await connectToDb();

    const user = await User.findById(session.user.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            followersCount: user.followers.length,
            followingCount: user.following.length,
            createdAt: user.createdAt
          }
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
      { status: 500 }
    );
  }
}
