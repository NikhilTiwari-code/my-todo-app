import { NextResponse } from "next/server";

/**
 * Debug endpoint to check what cookies are being received
 * GET /api/debug/cookies
 */
export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie");
  const authHeader = request.headers.get("Authorization");
  
  return NextResponse.json({
    cookies: cookieHeader || "No cookies found",
    authorization: authHeader || "No Authorization header",
    allHeaders: Object.fromEntries(request.headers.entries()),
  });
}
