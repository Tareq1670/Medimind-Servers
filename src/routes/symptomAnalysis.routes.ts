import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createSymptomAnalysisSchema,
  updateSymptomAnalysisSchema,
  symptomAnalysisQuerySchema,
} from "../validators/symptomAnalysis.validator.js";
import * as symptomController from "../controllers/symptomAnalysis.controller.js";

const router = Router();

router.get(
  "/",
  verifyToken,
  validateRequest(symptomAnalysisQuerySchema),
  symptomController.getAllAnalyses
);

router.get("/:id", verifyToken, symptomController.getAnalysisById);

router.post(
  "/",
  verifyToken,
  validateRequest(createSymptomAnalysisSchema),
  symptomController.createAnalysis
);

router.put(
  "/:id",
  verifyToken,
  validateRequest(updateSymptomAnalysisSchema),
  symptomController.updateAnalysis
);

router.delete("/:id", verifyToken, symptomController.deleteAnalysis);

export default router;
