// Load .env.local file
require('dotenv').config({ path: '.env.local' });

// Quick test to check Cloudinary env variables
console.log("=== Cloudinary Environment Check ===");
console.log("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "❌ MISSING");
console.log("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "❌ MISSING");
console.log("===================================");

if (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
  console.log("✅ All Cloudinary variables loaded successfully!");
} else {
  console.log("❌ Cloudinary variables are missing!");
  console.log("\n📝 Make sure .env.local has:");
  console.log("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dyg7rrsxh");
  console.log("NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default");
}
