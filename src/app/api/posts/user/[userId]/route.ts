// 👤 User Posts API - Get posts by specific user
// GET: Fetch all posts from a user (for profile page)

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // TODO: Get user's posts
  return NextResponse.json({ message: "GET user posts" });
}
