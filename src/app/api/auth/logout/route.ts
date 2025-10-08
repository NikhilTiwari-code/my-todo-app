import { NextResponse } from "next/server";

function buildLogoutResponse() {
  const res = NextResponse.json({ message: "Logged out" }, { status: 200 });
  // Clear the auth cookie
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // expire immediately
    path: "/",
  });
  return res;
}

export async function POST() {
  return buildLogoutResponse();
}

// Optional: allow GET for ease of testing in browser/Postman
export async function GET() {
  return buildLogoutResponse();
}


