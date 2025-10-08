import { Router } from "express";
import {
  getAllOrSingleUsers,
  modifyUser,
  deleteUser,
  bulkDeleteUsers,
  getInfo,
  getUserAnalytics,
} from "../controllers/userController.ts";
import cookieAuthMiddleware from "../middlewares/cookieMiddleware.ts";
import roleMiddleware from "../middlewares/roleMiddleware.ts";

const router = Router();

// Get current user info
router.get("/me", cookieAuthMiddleware, roleMiddleware, getInfo);

// Get user analytics (admin only)
router.get(
  "/analytics/:id",
  cookieAuthMiddleware,
  roleMiddleware,
  getUserAnalytics
);

// Get all users or single user by ID
router.get("/", cookieAuthMiddleware, roleMiddleware, getAllOrSingleUsers);
router.get("/:id", cookieAuthMiddleware, roleMiddleware, getAllOrSingleUsers);

// Update user (admin or self)
router.put("/:id", cookieAuthMiddleware, roleMiddleware, modifyUser);

// Delete single user (admin only)
router.delete("/:id", cookieAuthMiddleware, roleMiddleware, deleteUser);

// Bulk delete users (admin only)
router.post(
  "/bulk-delete",
  cookieAuthMiddleware,
  roleMiddleware,
  bulkDeleteUsers
);

export default router;
