import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.js";
import * as uploadController from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/image",
  verifyToken,
  upload.single("image"),
  uploadController.uploadImage
);

export default router;
