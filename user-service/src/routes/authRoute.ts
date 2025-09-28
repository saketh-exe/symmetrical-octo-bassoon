import { Router } from "express";
import { register,login,loginSession,logout,profile } from "../controllers/authController.ts";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/login-session", loginSession);
router.post("/logout", logout);
router.get("/profile", profile);


export default router;