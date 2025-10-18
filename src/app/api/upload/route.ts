// 📤 Upload API - Multi-image upload to Cloudinary
// POST: Upload multiple images (up to 10)

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Upload images to Cloudinary
  // Handle multiple images (carousel)
  return NextResponse.json({ message: "POST upload images" });
}
