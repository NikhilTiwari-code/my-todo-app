// 💬 Reply to Comment API
// POST: Reply to a comment (nested comment)

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: Create reply to comment
  return NextResponse.json({ message: "POST reply to comment" });
}
