import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";
import { env } from "../config/env.js";
import { AuthPayload } from "../types/auth.js";
import { sendError } from "../utils/response.js";

const JWKS = createRemoteJWKSet(new URL(env.jwksUri));

export async function protectRoute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token) {
      sendError(res, "Authentication required", 401);
      return;
    }

    const { payload } = await jwtVerify(token, JWKS);
    req.user = {
      userId: payload.sub as string,
      role: (payload.role as AuthPayload["role"]) ?? "user",
    };
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}
