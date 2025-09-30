import { Router } from "express";
import { getAllOrSingleUsers, modifyUser,deleteUser, getInfo  } from "../controllers/userController.ts";
import cookieAuthMiddleware from "../middlewares/cookieMiddleware.ts";
import roleMiddleware from "../middlewares/roleMiddleware.ts";


const router = Router();

router.get("/",cookieAuthMiddleware,roleMiddleware, getAllOrSingleUsers);
router.get("/me",cookieAuthMiddleware,roleMiddleware, getInfo);
router.get("/:id",cookieAuthMiddleware,roleMiddleware, getAllOrSingleUsers);
router.put("/:id",cookieAuthMiddleware,roleMiddleware, modifyUser);
router.delete("/:id",cookieAuthMiddleware,roleMiddleware, deleteUser);
export default router;
