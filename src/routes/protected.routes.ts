import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getProfile } from "../controllers/protected.controller.js";

const router = Router();

router.get("/me", protectRoute, getProfile);

export default router;
