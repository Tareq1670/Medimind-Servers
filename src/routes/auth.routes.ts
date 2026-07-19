import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import * as authController from "../controllers/auth.controller.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().transform((v) => v.toLowerCase()),
    password: z.string().min(8),
    role: z.enum(["user", "doctor"]).optional().default("user"),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.toLowerCase()),
    password: z.string().min(1),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

const router = Router();

router.post("/register", authLimiter, validateRequest(registerSchema), authController.register);
router.post("/login", authLimiter, validateRequest(loginSchema), authController.login);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.getProfile);

export default router;
