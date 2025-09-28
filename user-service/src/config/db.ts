import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function connectToDatabase(){
    try{
        const connection = await mongoose.connect(process.env.MONGO_DB_URL as string)
        console.log("Connected to MongoDB");
        console.log(connection.connection.db?.databaseName)
        return connection
    }
    catch(err){
        console.log("Error connecting to MongoDB", err);
        return null
    }
}

export default connectToDatabase;
