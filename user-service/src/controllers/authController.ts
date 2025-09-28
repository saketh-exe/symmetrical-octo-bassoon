import User from "../models/user.ts";
import bcrypt from "bcrypt"
import type { Request, Response } from "express";



export async function register(req: Request, res: Response) {

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required" });
    }
    try{
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message : "User already exists with this email"});
        }
        const hashedPassword = await bcrypt.hash(password,15)
        const user = new User({name,email,password: hashedPassword});
        await user.save()
        return res.status(200).json({message: "User created successfully!!!"})
    }
    catch(e){
        return res.status(500).json({ message: "Error checking existing user", error: (e as Error).message });
    }
}

export async function login(req: Request, res : Response) {
    const {email,password} = req.body;
    if (!email||!password) {
        return res.status(400).json({message: "Both Email and Password are required "})
    }
    try{
        const user = await User.findOne({email}).select('+password')
        if(!user) return res.status(400).json({message : "The user does not exist please register"})
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(isPasswordValid) {
            return res.status(200).json({message: "Login successful"})
        } else {
            return res.status(400).json({message: "Invalid password"})
        }
    }
    catch(e: unknown){
        return res.status(500).json({message : "Internal Server Error, please try again later ", error : (e as Error).message})
    }
}

export async function loginSession(req: Request, res: Response) {
    // TO DO: Implement session-based login
    res.status(501).json({ message: "Not implemented yet" });
}
export async function profile(req: Request, res: Response) {
    // TO DO: Implement user profile retrieval
    res.status(501).json({ message: "Not implemented yet" });
}
export async function logout(req: Request, res: Response) {
    // TO DO: Implement user logout
    res.status(501).json({ message: "Not implemented yet" });
}