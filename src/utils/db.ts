
import mongoose,{connect} from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI! ;

if (!MONGODB_URI) {
  throw new Error (
    "Please define the mongodb uri inside the env file"
  )
}


let cached = global.mongoose ;

if(!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

  async function connectToDb (){
    if (cached.conn) {
      return cached.conn
    }

    if (!cached.promise) {
      const opts ={
        bufferCommands: true,
        maxPoolSize: 10,
      }
       
      cached.promise = connect(MONGODB_URI, opts)
       .then(() => (mongoose.connection))
      }

    try {
      cached.conn = await cached.promise ;
    }catch (error){
      cached.promise = null ;
      throw error
    }

    return cached.conn;
    console.log("MongoDB connected");

}


export default connectToDb;