import mongoose from "mongoose";
import User from "../models/User.js";

export const roles = async (req, res, next) => {
    try {

        const user = await User.findOne({email : req.user.email});
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }   
        req.role = user.role;
        req.userId = user._id;
        console.log(req.role);
        if (req.role !== 'teacher' && req.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}