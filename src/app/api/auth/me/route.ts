import { NextResponse } from "next/server";
import User from "@/models/user.models";
import connectToDb from "@/utils/db";
import { getUserIdFromRequest } from "@/utils/auth";

/**
 * GET /api/auth/me
 * Get current authenticated user's details
 */
export async function GET(request: Request) {
    // Use the shared auth utility (checks both cookie and Authorization header)
    const auth = await getUserIdFromRequest(request);
    if ("error" in auth) return auth.error;

    try {
        await connectToDb();
        
        const user = await User.findById(auth.userId).select("-password -__v");
        
        if (!user) {
            return NextResponse.json(
                { 
                    error: {
                        code: "NOT_FOUND",
                        message: "User not found" 
                    }
                }, 
                { status: 404 }
            );
        }
        
        return NextResponse.json(
            { 
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                }
            }, 
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json(
            { 
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Failed to fetch user details" 
                }
            }, 
            { status: 500 }
        );
    }
}
