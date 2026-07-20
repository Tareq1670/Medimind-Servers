import { Request, Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";
import * as userService from "../services/user.service.js";

export function getProfile(req: Request, res: Response): void {
  sendSuccess(res, {
    user: req.user ?? null,
    message: "Authenticated via Better Auth JWT verified by JWKS.",
  });
}

export async function register(_req: Request, res: Response): Promise<void> {
  sendError(
    res,
    "Registration is handled by Better Auth on the frontend. Send requests to GET/POST /api/auth/* on the frontend URL.",
    501
  );
}

export async function login(_req: Request, res: Response): Promise<void> {
  sendError(
    res,
    "Login is handled by Better Auth on the frontend. Send requests to GET/POST /api/auth/* on the frontend URL.",
    501
  );
}

export async function logout(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, null, "Logged out successfully. Clear client-side tokens.");
}

export async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const result = await userService.getAllUsers(req.query as unknown as Parameters<typeof userService.getAllUsers>[0]);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, "Not authenticated", 401);
      return;
    }
    const allowed: Record<string, unknown> = {};
    if (req.body.name !== undefined) allowed.name = req.body.name;
    if (req.body.dob !== undefined) allowed.dob = req.body.dob;
    if (req.body.bloodGroup !== undefined) allowed.bloodGroup = req.body.bloodGroup;
    if (req.body.avatar !== undefined) allowed.avatar = req.body.avatar;
    const updated = await userService.updateUser(userId, allowed);
    sendSuccess(res, updated, "Profile updated");
  } catch (err) {
    sendError(res, (err as Error).message, 500);
  }
}
