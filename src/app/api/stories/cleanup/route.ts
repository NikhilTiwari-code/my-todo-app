import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import Story from "@/models/story.models";

// API route to delete expired stories
// Call this from a cron job or scheduled task
export async function GET() {
  try {
    await connectToDb();

    const deletedCount = await Story.deleteExpired();

    return NextResponse.json({
      message: "Expired stories deleted",
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting expired stories:", error);
    return NextResponse.json(
      { error: "Failed to delete expired stories" },
      { status: 500 }
    );
  }
}
