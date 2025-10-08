import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/user.models";
import connectToDb from "@/utils/db";
import jwt from "jsonwebtoken";
import { withRateLimit, getClientIp } from "@/middleware/rate-limit";
import { authRateLimiter, failedLoginLimiter } from "@/lib/rate-limiter";
import { loginSchema, formatZodError } from "@/lib/validations";


// login logic here
// 1. take user input (email,password) from request body
// 2. validate input with Zod
// 3. check if user exists by email
// 4. compare password with hashed password in db
// 5. if valid, create session or token
// 6. return success response with session or token


async function loginHandler(request: Request) {
  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = loginSchema.safeParse(body);
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

    const { email, password } = validation.data;

    await connectToDb();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        },
        { status: 401 }
      );
    }

    // Compare plaintext password against stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Track failed login attempt with stricter rate limit
      const ip = getClientIp(request);
      const failedCheck = failedLoginLimiter.check(`failed:${ip}:${email}`);
      
      if (!failedCheck.success) {
        return NextResponse.json(
          { 
            message: "Too many failed login attempts. Account temporarily locked.",
            retryAfter: Math.ceil((failedCheck.resetTime - Date.now()) / 1000)
          }, 
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        },
        { status: 401 }
      );
    }

    // Reset failed login counter on successful login
    failedLoginLimiter.reset(`failed:${getClientIp(request)}:${email}`);

    const tokenData = {
      id: user._id,
      email: user.email,
      name: user.name,
    };

    // create token
    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, { expiresIn: "1h" });

    const response = NextResponse.json(
      {
        message: "Login successful",
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
        },
      },
      { status: 200 }
    );

    // set token in httpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from strict to lax for better compatibility
      maxAge: 3600, // 1 hour
      path: "/", // Explicitly set path for all routes
    });

    return response;
  } catch (error) {
    console.error("Error logging in user:", error);
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

// Apply rate limiting: 5 attempts per 15 minutes per IP
export const POST = withRateLimit(loginHandler, {
  limiter: authRateLimiter,
  onRateLimitExceeded: (identifier, resetTime) => {
    console.warn(`Rate limit exceeded for ${identifier} at ${new Date().toISOString()}`);
  },
});

