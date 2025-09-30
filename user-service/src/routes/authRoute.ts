import { Router } from "express";
import {
  register,
  login,
  loginSession,
  logout,
  profile,
  tokenTest,
} from "../controllers/authController.ts";
import cookieAuthMiddleware from "../middlewares/cookieMiddleware.ts";

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/login-session", loginSession);
router.post("/logout", cookieAuthMiddleware, logout);
router.get("/profile", cookieAuthMiddleware, profile);
router.get("/token-test", tokenTest);
export default router;
