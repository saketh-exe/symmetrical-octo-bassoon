import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import courseRouter from './routes/courseRoutes.js';
import cookieParser from 'cookie-parser';
dotenv.config();



const app = express();
app.use(express.json());
app.use(cors(
  {
    origin: 'http://localhost:5173',
    credentials: true,
  }
));
app.use(cookieParser());
app.use("/course",courseRouter)

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_DB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });