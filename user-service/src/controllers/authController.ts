import User from "../models/user.ts";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import memoryStore from "../config/memoryStore.ts";
import crypto from "crypto";
import logger from "../utils/logger.ts";

const JWT_SECRET = process.env.JWT_SECRET as string;

interface CustomRequest extends Request {
  user?: string;
  token?: string;
  sessionId?: string;
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }
    const hashedPassword = await bcrypt.hash(password, 15);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = createToken(user.email);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60 * 1000,
    });
    return res.status(200).json({ message: "User created successfully!!!" });
  } catch (e) {
    logger.error(`Error in register function: ${(e as Error).message}`);
    return res.status(500).json({
      message: "Error checking existing user",
      error: (e as Error).message,
    });
  }
}

export async function login(req: Request, res: Response) {
  // token based login
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Both Email and Password are required " });
  }
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res
        .status(400)
        .json({ message: "The user does not exist please register" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = createToken(user.email);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60 * 1000,
      });
      return res.status(200).json({ message: "Login successful" });
    } else {
      return res.status(400).json({ message: "Invalid password" });
    }
  } catch (e: unknown) {
    logger.error(`Error in login function: ${(e as Error).message}`);
    return res.status(500).json({
      message: "Internal Server Error, please try again later ",
      error: (e as Error).message,
    });
  }
}

export async function loginSession(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Both Email and Password are required " });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ message: "The user does not exist please register" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const sessionId = crypto.randomBytes(16).toString("hex");
  memoryStore.set(sessionId, user.email);
  res.cookie("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
  return res.status(200).json({ message: "successfully logged in" });
}
export async function profile(req: CustomRequest, res: Response) {
  try {
    const userEmail = req.user;
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: {
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (e) {
    logger.error(`Error in profile function: ${(e as Error).message}`);
    return res.status(500).json({
      message: "Error retrieving profile",
      error: (e as Error).message,
    });
  }
}
export async function logout(req: CustomRequest, res: Response) {
  const { sessionId, token } = req;
  logger.info(
    `Logout request - sessionId: ${sessionId ? "present" : "none"}, token: ${
      token ? "present" : "none"
    }`
  );
  if (sessionId) {
    memoryStore.delete(sessionId);
    res.clearCookie("sessionId");
  }
  if (token) {
    res.clearCookie("token");
  }
  res.send({ message: "Logged out successfully" });
}

function createToken(email: string) {
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "30m" });
  return token;
}

export function tokenTest(req: Request, res: Response) {
  const { cookie } = req.headers;
  if (!cookie) return res.status(401).json({ message: "No cookie found" });
  const cookies = cookie?.split(";");
  logger.info(`Testing cookies: ${cookies}`);
  for (const c of cookies) {
    const [name, value] = c.trim().split("=");
    if (name === "sessionId") {
      const email = memoryStore.get(value as string);
      if (!email) logger.info("No session found");
      else logger.info(`Session found for email: ${email}`);
    }
    if (name === "token") {
      try {
        const decoded = jwt.verify(value as string, JWT_SECRET) as {
          email: string;
          iat: number;
          exp: number;
        };
        logger.info(`Token valid for email: ${decoded.email}`);
      } catch (e) {
        logger.error(`Invalid token in testToken: ${(e as Error).message}`);
        return res.status(401).json({ message: "Invalid token" });
      }
    }
  }
  return res.status(200).json({ message: "Token test successful" });
}
