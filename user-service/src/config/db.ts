import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import logger from "../utils/logger.ts";

async function connectToDatabase() {
  try {
    const connection = await mongoose.connect(
      process.env.MONGO_DB_URL as string
    );
    logger.info("Connected to MongoDB");
    logger.info(`Database name: ${connection.connection.db?.databaseName}`);
    return connection;
  } catch (err) {
    logger.error(`Error connecting to MongoDB: ${(err as Error).message}`);
    return null;
  }
}

export default connectToDatabase;
