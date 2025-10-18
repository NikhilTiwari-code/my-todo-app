import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";
import { getServerSession } from "@/utils/auth";
import crypto from "crypto";

// Helper function to upload to Cloudinary (Signed Upload - More Reliable!)
async function uploadToCloudinary(base64String: string, folder: string = "profiles") {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log("☁️ Cloudinary Config:", {
    cloudName: cloudName ? "✅ Set" : "❌ Missing",
    apiKey: apiKey ? "✅ Set" : "❌ Missing",
    apiSecret: apiSecret ? "✅ Set" : "❌ Missing",
    folder
  });

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("❌ Missing Cloudinary credentials!");
    throw new Error("Cloudinary credentials missing!");
  }

  try {
    // Generate timestamp and signature (signed upload)
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign)
      .digest("hex");

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log("📤 Uploading to:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        file: base64String,
        folder: folder,
        api_key: apiKey,
        timestamp: timestamp,
        signature: signature,
      }),
    });

    const responseText = await response.text();
    console.log("📥 Cloudinary Response Status:", response.status);

    if (!response.ok) {
      console.error("❌ Cloudinary Error Response:", responseText);
      throw new Error(`Cloudinary upload failed: ${response.status}`);
    }

    const data = JSON.parse(responseText);
    console.log("✅ Upload successful:", data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw error;
  }
}

// POST - Upload avatar and cover photo with Cloudinary
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
    const { avatar, bio, coverPhoto, website, location, birthday, gender, isPrivate } = body;

    console.log("📸 Profile Update Request:", {
      hasCoverPhoto: !!coverPhoto,
      isBase64: coverPhoto?.startsWith("data:image"),
      coverLength: coverPhoto?.length,
    });

    await connectToDb();

    const updateData: any = {};
    
    // Upload avatar to Cloudinary if it's a base64 string
    if (avatar !== undefined) {
      if (avatar === "" || avatar === null) {
        updateData.avatar = null;
      } else if (avatar.startsWith("data:image")) {
        console.log("⬆️ Uploading avatar to Cloudinary...");
        const cloudinaryUrl = await uploadToCloudinary(avatar, "avatars");
        console.log("✅ Avatar uploaded:", cloudinaryUrl);
        updateData.avatar = cloudinaryUrl;
      } else {
        // It's already a URL
        updateData.avatar = avatar;
      }
    }
    
    // Upload cover photo to Cloudinary if it's a base64 string
    if (coverPhoto !== undefined) {
      if (coverPhoto === "" || coverPhoto === null) {
        updateData.coverPhoto = null;
      } else if (coverPhoto.startsWith("data:image")) {
        console.log("⬆️ Uploading cover to Cloudinary...");
        const cloudinaryUrl = await uploadToCloudinary(coverPhoto, "covers");
        console.log("✅ Cover uploaded:", cloudinaryUrl);
        updateData.coverPhoto = cloudinaryUrl;
      } else {
        // It's already a URL
        updateData.coverPhoto = coverPhoto;
      }
    }
    
    if (bio !== undefined) updateData.bio = bio;
    if (website !== undefined) updateData.website = website;
    if (location !== undefined) updateData.location = location;
    if (birthday !== undefined) updateData.birthday = birthday;
    if (gender !== undefined) updateData.gender = gender;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

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
            coverPhoto: user.coverPhoto,
            website: user.website,
            location: user.location,
            birthday: user.birthday,
            gender: user.gender,
            isPrivate: user.isPrivate,
            isVerified: user.isVerified,
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
            coverPhoto: user.coverPhoto,
            website: user.website,
            location: user.location,
            birthday: user.birthday,
            gender: user.gender,
            isPrivate: user.isPrivate,
            isVerified: user.isVerified,
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
