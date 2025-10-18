import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import { getUserIdFromRequest } from "@/utils/auth";

export async function GET(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    await connectToDb();

    // Find the current user and populate their following
    const user = await User.findById(userId)
      .populate("following", "_id name username avatar isVerified")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.following || [],
    });
  } catch (error: any) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch following" },
      { status: 500 }
    );
  }
}
