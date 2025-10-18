// 📍 PASTE YOUR CLOUDINARY UPLOAD SIGNATURE CODE HERE
// POST: Generate Cloudinary upload signature

import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getUserIdFromRequest } from "@/utils/auth";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const authResult = await getUserIdFromRequest(request);
    if ("error" in authResult) {
      return authResult.error;
    }
    const { userId } = authResult;

    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Check if we have required env variables
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Missing Cloudinary environment variables");
      return NextResponse.json(
        { error: "Cloudinary configuration missing" },
        { status: 500 }
      );
    }

    // Create signature parameters (no upload_preset needed for signed upload)
    const params = {
      timestamp,
      folder: "reels",
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: "reels",
    });

  } catch (error) {
    console.error("Upload signature error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
