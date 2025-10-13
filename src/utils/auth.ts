import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Get JWT token from request (checks both cookie and Authorization header)
 */
function getTokenFromRequest(request: Request): string | null {
  // 1. Try to get token from Authorization header (for API clients)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // 2. Try to get token from cookie (for browser clients)
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  }

  return null;
}

/**
 * Get session from server-side (used in server components and API routes)
 * Returns user info or null
 */
export async function getServerSession(): Promise<{ user: { id: string; email: string; name: string } } | null> {
  try {
    // In API routes, get from headers
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const cookieHeader = headersList.get("cookie");
    
    if (!cookieHeader) return null;
    
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (!tokenMatch) return null;
    
    const token = tokenMatch[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; name: string };
    
    return { user: decoded };
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT token from cookie or Authorization header and extract userId
 * Returns userId or an error response
 */
export async function getUserIdFromRequest(
  request: Request
): Promise<{ userId: string } | { error: NextResponse }> {
  const token = getTokenFromRequest(request);

  if (!token) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authentication token. Please login.",
          },
        },
        { status: 401 }
      ),
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    return { userId: decoded.id };
  } catch (error) {
    const isExpired = error instanceof Error && 'name' in error && error.name === "TokenExpiredError";
    return {
      error: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: isExpired
              ? "Token expired. Please login again." 
              : "Invalid authentication token.",
          },
        },
        { status: 401 }
      ),
    };
  }
}
