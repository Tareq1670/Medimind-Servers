import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createHealthConditionSchema,
  updateHealthConditionSchema,
  healthConditionQuerySchema,
} from "../validators/healthCondition.validator.js";
import * as conditionController from "../controllers/healthCondition.controller.js";

const router = Router();

router.get(
  "/",
  validateRequest(healthConditionQuerySchema),
  conditionController.getAllConditions
);

router.get("/:id", conditionController.getConditionById);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  validateRequest(createHealthConditionSchema),
  conditionController.createCondition
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  validateRequest(updateHealthConditionSchema),
  conditionController.updateCondition
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  validateRequest(updateHealthConditionSchema),
  conditionController.updateCondition
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  conditionController.deleteCondition
);

export default router;
