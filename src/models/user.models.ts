import mongoose,{Schema,Document,Model,models} from "mongoose";
import bcrypt from "bcryptjs";
//import {IUser} from "../types/user.types";


export interface IUser extends Document{
    name:string;
    email:string;
    password:string;
    avatar?: string; // Profile photo URL
    coverPhoto?: string; // Cover photo URL
    bio?: string; // User bio
    website?: string; // Personal website
    location?: string; // City, Country
    birthday?: Date; // Date of birth
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    isPrivate: boolean; // Private account
    isVerified: boolean; // Verified badge
    followers: mongoose.Types.ObjectId[]; // Array of user IDs who follow this user
    following: mongoose.Types.ObjectId[]; // Array of user IDs this user follows
    createdAt:Date;
    updatedAt:Date;
    comparePassword(enteredPassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

// Define the User schema

const userSchema:Schema<IUser> = new Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        minlength:[6,"Password must be at least 6 characters long"]
    },
    avatar:{
        type:String,
        default: null
    },
    coverPhoto:{
        type:String,
        default: null
    },
    bio:{
        type:String,
        default: '',
        maxlength: 500
    },
    website:{
        type:String,
        default: ''
    },
    location:{
        type:String,
        default: ''
    },
    birthday:{
        type:Date,
        default: null
    },
    gender:{
        type:String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    isPrivate:{
        type:Boolean,
        default: false
    },
    isVerified:{
        type:Boolean,
        default: false
    },
    followers:[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    following:[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
},{
    timestamps:true
});

// Note: Email index already created via 'unique: true' in schema (line 38)
// No need for duplicate index definition


// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function(enteredPassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error("Error comparing passwords:", error);
        return false;
    }
};







// Create and export the User model

const User:Model<IUser> = models.User || mongoose.model<IUser>('User',userSchema);
export default User;
