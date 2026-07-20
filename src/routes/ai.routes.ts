import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/upload.js";
import { aiRateLimiter } from "../middleware/rateLimiter.js";
import {
  symptomAnalysisSchema,
  reportAnalysisSchema,
  chatMessageSchema,
  generateBlogSchema,
  recommendationSchema,
  healthInsightsSchema,
  classifyTagsSchema,
  aiHistoryQuerySchema,
} from "../validators/ai.validator.js";
import * as aiController from "../controllers/ai.controller.js";

const router = Router();

router.use(aiRateLimiter);

router.post(
  "/symptom-analysis",
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

router.post(
  "/chat",
  verifyToken,
  validateRequest(chatMessageSchema),
  aiController.chatMessage
);

router.post(
  "/generate-blog",
  verifyToken,
  validateRequest(generateBlogSchema),
  aiController.generateBlog
);

router.post(
  "/medicine-recommendation",
  verifyToken,
  validateRequest(recommendationSchema),
  aiController.getRecommendations
);

router.post(
  "/health-insights",
  verifyToken,
  validateRequest(healthInsightsSchema),
  aiController.getHealthInsights
);

router.post(
  "/classify-tags",
  verifyToken,
  validateRequest(classifyTagsSchema),
  aiController.classifyTags
);

router.get(
  "/history",
  verifyToken,
  validateRequest(aiHistoryQuerySchema),
  aiController.getHistory
);

export default router;
