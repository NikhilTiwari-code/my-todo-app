import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // Verify the token is valid
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
      // Return the token for socket connection
      return NextResponse.json({ token });
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error) {
    console.error("Socket token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}