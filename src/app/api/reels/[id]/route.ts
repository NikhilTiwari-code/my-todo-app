// 📍 PASTE YOUR SINGLE REEL API CODE HERE
// GET: Fetch specific reel
// DELETE: Delete reel

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Paste your GET single reel code here
  return NextResponse.json({ message: "GET single reel - paste your code" });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Paste your DELETE reel code here
  return NextResponse.json({ message: "DELETE reel - paste your code" });
}
