import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToDatabase from "./config/db.ts";
import userRoute from "./routes/userRoute.ts";
import authRoute from "./routes/authRoute.ts";
import cookieParser from "cookie-parser";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());



app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);

app.listen(process.env.PORT || 3000, async () => {
  await connectToDatabase();
  console.log(`User Service is running on port ${process.env.PORT || 3000}`);
});
