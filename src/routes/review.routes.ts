import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewQuerySchema,
} from "../validators/review.validator.js";
import * as reviewController from "../controllers/review.controller.js";

const router = Router();

router.get(
  "/",
  validateRequest(reviewQuerySchema),
  reviewController.getAllReviews
);

router.get(
  "/:targetType/:targetId",
  reviewController.getReviewsByTarget
);

router.get("/:id", reviewController.getReviewById);

router.post(
  "/",
  verifyToken,
  validateRequest(createReviewSchema),
  reviewController.createReview
);

router.put(
  "/:id",
  verifyToken,
  validateRequest(updateReviewSchema),
  reviewController.updateReview
);

router.patch(
  "/:id/approve",
  verifyToken,
  authorizeRoles("admin"),
  reviewController.approveReview
);

router.delete("/:id", verifyToken, reviewController.deleteReview);

export default router;
