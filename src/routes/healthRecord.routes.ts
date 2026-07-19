import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createHealthRecordSchema,
  updateHealthRecordSchema,
} from "../validators/healthRecord.validator.js";
import * as healthRecordController from "../controllers/healthRecord.controller.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();

const DEPRECATED_WARNING =
  "deprecated — use /api/v1/records instead";

router.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Deprecated", DEPRECATED_WARNING);
  console.warn(`[DEPRECATED] ${_req.method} ${_req.originalUrl} — ${DEPRECATED_WARNING}`);
  next();
});

router.get("/me", verifyToken, healthRecordController.getMyHealthRecord);

router.get(
  "/patient/:patientId",
  verifyToken,
  healthRecordController.getHealthRecordByPatientId
);

router.post(
  "/",
  verifyToken,
  validateRequest(createHealthRecordSchema),
  healthRecordController.createHealthRecord
);

router.put(
  "/",
  verifyToken,
  validateRequest(updateHealthRecordSchema),
  healthRecordController.updateHealthRecord
);

router.delete("/", verifyToken, healthRecordController.deleteHealthRecord);

export default router;
