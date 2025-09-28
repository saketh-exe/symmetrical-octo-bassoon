import mongoose from "mongoose";
import User from "../models/user.ts";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";

export async function getAllUsers(req: Request, res: Response) {
  try {
    const users = await User.find().select("name email role");
    res.status(200).json({ users });
  } catch (e) {
    if (e instanceof mongoose.Error.DocumentNotFoundError) {
      res.status(404).json({ message: "User not found", error: e.message });
    } else {
      res
        .status(500)
        .json({ message: "Error fetching user", error: (e as Error).message });
    }
  }
}

export async function addUser(req: Request, res: Response) {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({
      message: "Password is required and should be at least 6 characters long",
    });
  }
  const hashedPassword = await bcrypt.hash(password, 15);
  const user = new User({ ...req.body, password: hashedPassword });

  try {
    await user.save();
    return res.status(201).json({ message: "User added successfully" });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Error adding user", error: (e as Error).message });
  }
}
