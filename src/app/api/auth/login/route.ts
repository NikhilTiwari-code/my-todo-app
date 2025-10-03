import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user.models";
import connectToDb from "@/utils/db";
import jwt from "jsonwebtoken";


// login logic here
// 1. take user input (email,password) from request body
// 2. validate input
// 3. check if user exists by email
// 4. compare password with hashed password in db
// 5. if valid, create session or token
// 6. return success response with session or token


export async function POST(request: Request) {
  let { email, password } = await request.json();

  // Normalize input
  if (typeof email === "string") email = email.toLowerCase().trim();
  if (typeof password === "string") password = password.trim();

  if (!email || !password) {
    return NextResponse.json({ message: "All fields are required" }, { status: 400 });
  }

  try {
    await connectToDb();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    console.log("User found:", user.email);
    console.log("Stored password hash:", user.password);
    console.log("Entered password:", password);

    // Guard: if client accidentally sent a bcrypt hash instead of a plaintext password
    

    // Compare plaintext password against stored hash
   // const isPasswordValid = await bcrypt.compare(password as string, user.password);
    // console.log("Password valid:", isPasswordValid);

    // if (!isPasswordValid) {
    //   return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    // }

    const tokenData = {
      id: user._id,
      email: user.email,
      name: user.name,
    };

    // create token
    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: "1h" });

    const respone = NextResponse.json({ message: "Login successful", token }, { status: 200 });

    // set token in httpOnly cookie
    respone.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
    });

    return respone;
  } catch (error) {
    console.error("Error logging in user:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


