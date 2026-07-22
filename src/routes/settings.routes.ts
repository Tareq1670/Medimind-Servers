import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import * as settingsController from "../controllers/settings.controller.js";

const router = Router();

router.get("/", verifyToken, authorizeRoles("admin"), settingsController.getSettings);
router.put("/", verifyToken, authorizeRoles("admin"), settingsController.updateSettings);

export default router;
