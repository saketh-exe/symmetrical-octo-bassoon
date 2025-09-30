import mongoose from "mongoose";
import User from "../models/user.ts";
import type { Request, Response } from "express";
import logger from "../utils/logger.ts";

interface CustomRequest extends Request {
  user?: string;
  token?: string;
  sessionId?: string;
  role?: string;
  id?: string;
}

export async function getAllOrSingleUsers(req: CustomRequest, res: Response) {
  const paramId = req.params.id;
  if (paramId) {
    // trying to access specific user
    if (req.role !== "admin" && req.id !== paramId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    try {
      const foundUser = await User.findById(paramId).select("name email role");
      if (!foundUser)
        return res.status(404).json({ message: "User not found" });
      return res.status(200).json({ user: foundUser });
    } catch (e) {
      logger.error(`Error in getAllUsers: ${(e as Error).message}`);
      return res.status(500).json({
        message: "Error fetching user",
        error: (e as Error).message,
      });
    }
  }
  if (req.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    // admin accessing all users
    const users = await User.find().select("name email role");
    return res.status(200).json({ users });
  } catch (e) {
    if (e instanceof mongoose.Error.DocumentNotFoundError) {
      return res
        .status(404)
        .json({ message: "User not found", error: e.message });
    } else {
      logger.error(`Error in getAllUsers (admin): ${(e as Error).message}`);
      return res
        .status(500)
        .json({ message: "Error fetching user", error: (e as Error).message });
    }
  }
}

export async function modifyUser(req: CustomRequest, res: Response) {
  const paramId = req.params.id;
  if (!paramId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (req.role !== "admin" && req.id !== paramId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const { name } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      paramId,
      { name },
      { new: true }
    ).select("name email role");
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user: updatedUser });
  } catch (e) {
    logger.error(`Error in updateUser: ${(e as Error).message}`);
    return res
      .status(500)
      .json({ message: "Error updating user", error: (e as Error).message });
  }
}
export async function deleteUser(req: CustomRequest, res: Response) {
  const paramId = req.params.id;
  if (!paramId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (req.role !== "admin" && req.id !== paramId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  try {
    const deletedUser = await User.findByIdAndDelete(paramId);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (e) {
    logger.error(`Error in deleteUser: ${(e as Error).message}`);
    return res
      .status(500)
      .json({ message: "Error deleting user", error: (e as Error).message });
  }
}

export async function getInfo(req: CustomRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const foundUser = await User.findOne({ email: req.user }).select(
      "-password"
    );
    if (!foundUser) {
      logger.warn(`User not found: ${req.user}`);
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user: foundUser });
  } catch (e) {
    logger.error(`Error in getInfo: ${(e as Error).message}`);
    return res
      .status(500)
      .json({
        message: "Error fetching user info",
        error: (e as Error).message,
      });
  }
}
