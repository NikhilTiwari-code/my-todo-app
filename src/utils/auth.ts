import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

/**
 * Verify JWT token from Authorization header and extract userId
 * Returns userId or an error response
 */
export async function getUserIdFromRequest(
  request: Request
): Promise<{ userId: string } | { error: NextResponse }> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : undefined;

  if (!token) {
    return {
      error: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Missing Bearer token",
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
    return {
      error: NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          },
        },
        { status: 401 }
      ),
    };
  }
}
