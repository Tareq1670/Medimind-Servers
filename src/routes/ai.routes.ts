import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/upload.js";
import {
  symptomAnalysisSchema,
  reportAnalysisSchema,
  aiHistoryQuerySchema,
} from "../validators/ai.validator.js";
import * as aiController from "../controllers/ai.controller.js";

const router = Router();

router.post(
  "/symptom-analysis",
  verifyToken,
  validateRequest(symptomAnalysisSchema),
  aiController.analyzeSymptoms
);

router.post(
  "/report-analysis",
  verifyToken,
  upload.single("reportImage"),
  validateRequest(reportAnalysisSchema),
  aiController.analyzeReport
);

router.get(
  "/history",
  verifyToken,
  validateRequest(aiHistoryQuerySchema),
  aiController.getHistory
);

export default router;
