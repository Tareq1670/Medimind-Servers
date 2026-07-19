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

router.get("/me", verifyToken, healthRecordController.getMyHealthRecord);

router.get(
  "/patient/:patientId",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  healthRecordController.getHealthRecordByPatientId
);

router.post(
  "/",
  verifyToken,
  validateRequest(createHealthRecordSchema),
  healthRecordController.createHealthRecord
);

router.put(
  "/me",
  verifyToken,
  validateRequest(updateHealthRecordSchema),
  healthRecordController.updateHealthRecord
);

router.delete("/me", verifyToken, healthRecordController.deleteHealthRecord);

export default router;
