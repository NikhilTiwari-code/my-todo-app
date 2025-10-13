// writing authentication logic here
// for user registration todos
// 1. take user input (email, password,name) from request body
// 2. validate input with Zod
// 3. check if user already exists by email
// 4. hash password
// 5. create new user in db
// 6. return success response
// 7. send to login page
    
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import User from "@/models/user.models";
import connectToDb from "@/utils/db";
import jwt from "jsonwebtoken";
import { withRateLimit } from "@/middleware/rate-limit";
import { authRateLimiter } from "@/lib/rate-limiter";
import { registerSchema, formatZodError } from "@/lib/validations";



async function registerHandler(request: Request) {
  try {
    const body = await request.json();
    
    // Audit loggging
    const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

    console.log(`[REGISTER ATTEMPT] ${new Date().toISOString()} | IP: ${ip} | Email: ${body.email}`);

  
    // Validate input with Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: formatZodError(validation.error),
          },
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    await connectToDb();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            code: "USER_EXISTS",
            message: "User already exists with this email",
          },
        },
        { status: 400 }
      );
    }

    // hash password method i have used is bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Create token for automatic login after registration
    const tokenData = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
    };

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: "1h" });

    const response = NextResponse.json(
      {
        message: " registeration successfully",
        data: {
          token,
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
          },
        },
      },
      { status: 201 }
    );

    // set token in httpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error registering user:", error);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal Server Error",
        },
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting: 5 registration attempts per 15 minutes per IP
export const POST = withRateLimit(registerHandler, {
  limiter: authRateLimiter,
});




