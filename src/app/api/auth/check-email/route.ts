// Check if email is already in user db
// we will use debounce technique to check email availability
// 1. take email input from request body
// 2. validate email format
// 3. check if email exists in db
// 4. return response

import { NextResponse } from "next/server";
import connectToDb from "@/utils/db";
import User from "@/models/user.models";



export async function GET(request: Request) { 
    const {email} = Object.fromEntries(new URL(request.url).searchParams) as {email: string};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return new Response(JSON.stringify({message: 'Invalid email format'}), {status: 400});
    }

   try {
     await connectToDb();
     const user = await User.findOne({email});
        if (user) {
            return NextResponse.json({
                available: false,
                message: 'Email already taken'
            }, {status: 200});
        }
        return NextResponse.json({
            available: true,
            message: 'Email available'
        }, {status: 200});
    
    

   } catch (error) {
       console.error('Email check error:', error);
       return NextResponse.json({
           available: false,
           message: 'Error checking email'
       }, {status: 500});
   }

}

