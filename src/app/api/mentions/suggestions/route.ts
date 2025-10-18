import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/auth";
import { getMentionSuggestions } from "@/utils/mentions";

/**
 * GET /api/mentions/suggestions?q=john
 * Get user suggestions for @ autocomplete
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await getUserIdFromRequest(req);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    const suggestions = await getMentionSuggestions(query, userId, limit);

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error("Mention suggestions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
