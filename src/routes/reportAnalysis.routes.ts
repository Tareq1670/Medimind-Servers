import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { upload } from "../middleware/upload.js";
import {
  createReportAnalysisSchema,
  updateReportAnalysisSchema,
  reportAnalysisQuerySchema,
} from "../validators/reportAnalysis.validator.js";
import * as reportController from "../controllers/reportAnalysis.controller.js";

const router = Router();

router.get(
  "/",
  verifyToken,
  validateRequest(reportAnalysisQuerySchema),
  reportController.getAllReports
);

router.get("/:id", verifyToken, reportController.getReportById);

router.post(
  "/",
  verifyToken,
  upload.single("uploadedImage"),
  validateRequest(createReportAnalysisSchema),
  reportController.createReport
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "doctor"),
  upload.single("uploadedImage"),
  validateRequest(updateReportAnalysisSchema),
  reportController.updateReport
);

router.delete("/:id", verifyToken, authorizeRoles("admin", "doctor"), reportController.deleteReport);

export default router;
