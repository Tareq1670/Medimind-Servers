import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/upload.js";
import {
  createBlogSchema,
  updateBlogSchema,
  blogQuerySchema,
} from "../validators/blog.validator.js";
import * as blogController from "../controllers/blog.controller.js";

const router = Router();

router.get(
  "/",
  validateRequest(blogQuerySchema),
  blogController.getAllBlogs
);

router.get("/:id", blogController.getBlogById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("coverImage"),
  validateRequest(createBlogSchema),
  blogController.createBlog
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("coverImage"),
  validateRequest(updateBlogSchema),
  blogController.updateBlog
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("coverImage"),
  validateRequest(updateBlogSchema),
  blogController.updateBlog
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  blogController.deleteBlog
);

export default router;
