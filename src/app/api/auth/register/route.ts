// writing authentication logic here
// for user registration todos
// 1. take user input (email, password,name) from request body
//2. validate input
//3. check if user already exists byy email
//4. hash password
//5. create new user in db
// 6. return success response
//7.send to login page
    
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import User from "@/models/user.models";
import connectToDb from "@/utils/db";



export async function POST(request: Request) {
    const body = await request.json();
    let { name, email, password } = body as { name: string; email: string; password: string };

    
    if (!name || !email || !password) {
        return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }
    try {
        await connectToDb();
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        // hash password method i have used is bcryptjs
       // const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email,  password });
        await newUser.save();
       
        return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

        // redirect to login page
    } catch (error) {
        console.error("Error registering user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}





