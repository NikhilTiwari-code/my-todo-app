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

    const oldSecret = "8f3d9a2b7c1e4f6a5d8b9c0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a";
    const newSecret = "593e531b7572f114f3ae7ec262a1fd8db2e5198439c4aff306a7fd61a288a5e9";
    const currentSecret = process.env.JWT_SECRET || "";

    const tests = [
      { name: "OLD secret", secret: oldSecret },
      { name: "NEW secret", secret: newSecret },
      { name: "CURRENT env secret", secret: currentSecret },
    ];

    const results = tests.map(({ name, secret }) => {
      try {
        const decoded = jwt.verify(token, secret);
        return { name, success: true, decoded };
      } catch (err: any) {
        return { name, success: false, error: err.message };
      }
    });

    return NextResponse.json({ 
      tokenLength: token.length,
      tokenFirst30: token.substring(0, 30),
      currentSecretFirst10: currentSecret.substring(0, 10),
      currentSecretLength: currentSecret.length,
      results
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Debug error", 
      message: error.message 
    }, { status: 500 });
  }
}
