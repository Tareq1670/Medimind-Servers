import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import * as statsController from "../controllers/stats.controller.js";

const router = Router();

router.get(
  "/dashboard",
  verifyToken,
  authorizeRoles("admin"),
  statsController.getDashboard
);

export default router;
