import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectToDatabase from "./config/db.ts";
import cors from "cors";
import userRoute from "./routes/userRoute.ts";

const app = express();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("User Service is running");
});

app.use("/api/users", userRoute);

app.listen(process.env.PORT || 3000, async () => {
  await connectToDatabase();
  console.log(`User Service is running on port ${process.env.PORT || 3000}`);
});
