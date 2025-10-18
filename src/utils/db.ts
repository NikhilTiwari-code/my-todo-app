import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env file");
}

/**
 * Global cache for Mongoose connection
 * Prevents creating new connections on every API request
 */
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: CachedConnection = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with optimized settings
 * ⚡ Performance optimizations:
 * - Connection pooling (50 connections)
 * - Server selection timeout: 5s (fast fail)
 * - Socket timeout: 45s
 * - Connection caching (reuse existing connection)
 */
async function connectToDb() {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection if none exists
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for faster errors
      maxPoolSize: 50,       // Increase connection pool (default: 10)
      minPoolSize: 10,       // Maintain minimum connections
      serverSelectionTimeoutMS: 5000,  // Fail fast (5s instead of 30s)
      socketTimeoutMS: 45000,          // Socket timeout
      family: 4,             // Use IPv4, skip IPv6 (faster DNS)
    };

    console.log(" Creating new MongoDB connection...");
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(" MongoDB connected successfully");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // Reset on error
    console.error(" MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
}

export default connectToDb;