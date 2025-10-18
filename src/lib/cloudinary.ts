


// *****************************************

// src/lib/cloudinary.ts

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Validate configuration
if (!cloudName || !apiKey || !apiSecret) {
  console.error('Cloudinary configuration missing:', {
    cloudName: cloudName ? '✓' : '✗',
    apiKey: apiKey ? '✓' : '✗',
    apiSecret: apiSecret ? '✓' : '✗'
  });
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload image to Cloudinary
 * @param file - Base64 string or file path
 * @param folder - Folder in Cloudinary (e.g., 'instagram/posts')
 * @param options - Additional upload options
 */
export async function uploadToCloudinary(
  file: string,
  folder: string = "instagram/posts",
  options: any = {}
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "auto",
      transformation: [
        { width: 1080, height: 1080, crop: "limit" }, // Max size
        { quality: "auto" }, // Auto quality
        { fetch_format: "auto" }, // Auto format (webp, etc.)
      ],
      ...options,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: string[],
  folder: string = "instagram/posts"
): Promise<CloudinaryUploadResult[]> {
  try {
    const uploadPromises = files.map((file) =>
      uploadToCloudinary(file, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Multiple upload error:", error);
    throw new Error("Failed to upload images");
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string
): Promise<{ result: string }> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image");
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteMultipleFromCloudinary(
  publicIds: string[]
): Promise<void> {
  try {
    const deletePromises = publicIds.map((id) => deleteFromCloudinary(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Multiple delete error:", error);
    throw new Error("Failed to delete images");
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  } = {}
): string {
  const {
    width = 400,
    height = 400,
    crop = "fill",
    quality = "auto",
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop },
      { quality },
      { fetch_format: "auto" },
    ],
  });
}

/**
 * Upload video to Cloudinary for reels
 * @param file - Base64 string or file path
 * @param options - Additional upload options
 */
export async function uploadVideoToCloudinary(
  file: string,
  options: any = {}
): Promise<CloudinaryUploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: "reels",
      resource_type: "video",
      transformation: [
        { quality: "auto" }, // Auto quality
        { fetch_format: "auto" }, // Auto format
      ],
      ...options,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary video upload error:", error);
    throw new Error("Failed to upload video");
  }
}

/**
 * Generate video thumbnail URL
 */
export function getVideoThumbnailUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    time?: number; // Time in seconds for thumbnail
  } = {}
): string {
  const {
    width = 400,
    height = 711, // 9:16 aspect ratio
    time = 1, // First second
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: "fill" },
      { video_sampling: "seconds:1" }, // Sample at 1 second
      { start_offset: time },
      { resource_type: "video" },
      { format: "jpg" },
    ],
  });
}

/**
 * Get optimized video URL with transformations
 */
export function getOptimizedVideoUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
  } = {}
): string {
  const {
    width = 720,
    height = 1280, // 9:16 aspect ratio
    quality = "auto",
  } = options;

  return cloudinary.url(publicId, {
    transformation: [
      { width, height, crop: "limit" },
      { quality },
      { fetch_format: "auto" },
      { resource_type: "video" },
    ],
  });
}

/**
 * Extract public ID from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    const publicId = filename.split(".")[0];
    
    // Get folder path
    const folderIndex = parts.indexOf("upload") + 2; // Skip version (v1234567890)
    const folders = parts.slice(folderIndex, -1).join("/");
    
    return folders ? `${folders}/${publicId}` : publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return "";
  }
}

export default cloudinary;