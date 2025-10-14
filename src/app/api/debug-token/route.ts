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

    // Debug token details
    const decoded = jwt.decode(token, { complete: true });
    
    return NextResponse.json({ 
      tokenExists: !!token,
      tokenLength: token.length,
      tokenFirst20: token.substring(0, 20),
      jwtSecretExists: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length,
      jwtSecretFirst10: process.env.JWT_SECRET?.substring(0, 10),
      decodedHeader: decoded?.header,
      decodedPayload: decoded?.payload,
      canVerify: (() => {
        try {
          jwt.verify(token, process.env.JWT_SECRET!);
          return "YES";
        } catch (err: any) {
          return `NO: ${err.message}`;
        }
      })()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Debug error", 
      message: error.message 
    }, { status: 500 });
  }
}