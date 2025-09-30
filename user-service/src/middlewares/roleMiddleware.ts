import type { Request, Response, NextFunction } from "express";
import User from "../models/user.ts";
import logger from "../utils/logger.ts";

interface CustomRequest extends Request {
  user?: string;
  token?: string;
  sessionId?: string;
  role?: string;
  id?: string;
}

export default async function roleMiddleware(
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const { user } = req;
  if (!user) return res.status(401).json({ message: "No user found" });
  try {
    const foundUser = await User.findOne({ email: user });
    if (!foundUser) return res.status(401).json({ message: "User not found" });
    req.role = foundUser.role;
    req.id = foundUser._id.toString();
    return next();
  } catch (err) {
    logger.error(`Error in roleMiddleware: ${(err as Error).message}`);
    return res.status(500).json({ message: "Internal server error" });
  }
}
