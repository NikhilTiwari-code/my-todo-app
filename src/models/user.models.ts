import mongoose,{Schema,Document,Model,models} from "mongoose";
import bcrypt from "bcryptjs";
//import {IUser} from "../types/user.types";


export interface IUser extends Document{
    name:string;
    email:string;
    password:string;
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
    }
},{
    timestamps:true
});

// Index for email (unique and frequently queried)
userSchema.index({ email: 1 }, { unique: true });


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
