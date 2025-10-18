import { NextRequest, NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Post from "@/models/post.model";
import HashtagStats from "@/models/hashtagStats.model";

type RouteContext = {
  params: Promise<{ tag: string }>;
};

/**
 * GET /api/hashtags/[tag]?sort=recent|top
 * Get all posts with a specific hashtag
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const { tag } = await context.params;
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "recent";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");

    await connectToDb();

    // Get hashtag stats
    const stats = await HashtagStats.findOne({
      hashtag: tag.toLowerCase()
    }).select("postCount trendingScore category").lean();

    // Build query
    const query = {
      hashtags: tag.toLowerCase(),
      isArchived: false,
    };

    // Build sort
    const sortQuery: any = sort === "top"
      ? { likeCount: -1 }  // Most liked first
      : { createdAt: -1 };  // Most recent first

    // Fetch posts
    const skip = (page - 1) * limit;
    const posts = await Post.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate("userId", "name username avatar")
      .select("images caption likes commentCount createdAt")
      .lean();

    // Add like count
    const postsWithCounts = posts.map((post: any) => ({
      ...post,
      likeCount: post.likes?.length || 0,
    }));

    return NextResponse.json({
      success: true,
      posts: postsWithCounts,
      stats: stats || { postCount: 0, trendingScore: 0, category: "general" },
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error: any) {
    console.error("Hashtag API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch hashtag data" },
      { status: 500 }
    );
  }
}
