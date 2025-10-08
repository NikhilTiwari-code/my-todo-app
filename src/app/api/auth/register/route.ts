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
import { withRateLimit } from "@/middleware/rate-limit";
import { authRateLimiter } from "@/lib/rate-limiter";
import { registerSchema, formatZodError } from "@/lib/validations";



async function registerHandler(request: Request) {
  try {
    const body = await request.json();

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

    return NextResponse.json(
      {
        message: "User registered successfully",
        data: {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
          },
        },
      },
      { status: 201 }
    );

    // redirect to login page
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




