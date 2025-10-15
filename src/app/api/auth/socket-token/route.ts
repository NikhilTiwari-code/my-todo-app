import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getUserIdFromRequest } from "@/utils/auth";

// This secret is ONLY for the socket token. It's different from the main JWT secret.
const SOCKET_JWT_SECRET = process.env.SOCKET_JWT_SECRET;

if (!SOCKET_JWT_SECRET) {
  console.error("FATAL: SOCKET_JWT_SECRET is not defined in the environment.");
}

export async function GET(req: NextRequest) {
  if (!SOCKET_JWT_SECRET) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    // First, verify the user is authenticated with their main token (from cookie/header)
    const userResult = await getUserIdFromRequest(req);
    if ("error" in userResult) {
      // If getUserIdFromRequest returns an error, it's already a NextResponse
      return userResult.error;
    }

    const userId = userResult.userId;

    // If authenticated, create a short-lived token specifically for the socket server
    const socketToken = jwt.sign({ id: userId }, SOCKET_JWT_SECRET, { expiresIn: "1m" });

    return NextResponse.json({ token: socketToken });
  } catch (error) {
    console.error("Error generating socket token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}