import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import {
  createChatSessionSchema,
  sendMessageSchema,
  updateChatStatusSchema,
  chatSessionQuerySchema,
} from "../validators/chatSession.validator.js";
import * as chatController from "../controllers/chatSession.controller.js";

const router = Router();

router.get(
  "/",
  verifyToken,
  validateRequest(chatSessionQuerySchema),
  chatController.getAllSessions
);

router.get("/:id", verifyToken, chatController.getSessionById);

router.post(
  "/",
  verifyToken,
  validateRequest(createChatSessionSchema),
  chatController.createSession
);

router.post(
  "/:id/messages",
  verifyToken,
  validateRequest(sendMessageSchema),
  chatController.sendMessage
);

router.patch(
  "/:id/status",
  verifyToken,
  validateRequest(updateChatStatusSchema),
  chatController.updateSessionStatus
);

router.delete("/:id", verifyToken, chatController.deleteSession);

export default router;
