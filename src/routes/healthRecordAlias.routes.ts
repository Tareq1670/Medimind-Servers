import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createHealthRecordSchema,
  updateHealthRecordSchema,
} from "../validators/healthRecord.validator.js";
import * as healthRecordController from "../controllers/healthRecord.controller.js";

const router = Router();

router.get("/", verifyToken, healthRecordController.getMyHealthRecord);
router.post("/", verifyToken, validateRequest(createHealthRecordSchema), healthRecordController.createHealthRecord);
router.put("/", verifyToken, validateRequest(updateHealthRecordSchema), healthRecordController.updateHealthRecord);
router.delete("/", verifyToken, healthRecordController.deleteHealthRecord);

export default router;
