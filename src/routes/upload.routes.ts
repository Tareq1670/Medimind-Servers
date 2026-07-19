import { Router } from "express";
import { upload } from "../middleware/upload.js";
import * as uploadController from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/image",
  upload.single("image"),
  uploadController.uploadImage
);

export default router;
