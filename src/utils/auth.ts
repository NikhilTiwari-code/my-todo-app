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
  } catch (error: any) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: error.name === "TokenExpiredError" 
              ? "Token expired. Please login again." 
              : "Invalid authentication token.",
          },
        },
        { status: 401 }
      ),
    };
  }
}
