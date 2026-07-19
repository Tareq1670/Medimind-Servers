import { Request, Response, NextFunction } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";
import { ObjectId } from "mongodb";
import { env } from "../config/env.js";
import { getDB } from "../config/db.js";
import type { AuthPayload } from "../types/auth.js";

let JWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let lastJwksFetchAttempt = 0;
const JWKS_RETRY_COOLDOWN = 30_000;

function getJWKS(): ReturnType<typeof createRemoteJWKSet> {
  if (!JWKS) {
    JWKS = createRemoteJWKSet(new URL(env.jwksUri), {
      cacheMaxAge: 300_000,
      cooldownDuration: 30_000,
      timeoutDuration: 3_000,
    });
  }
  return JWKS;
}

function isJwksFetchError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("jwks") ||
      msg.includes("getaddrinfo") ||
      msg.includes("enotfound") ||
      msg.includes("econnrefused") ||
      msg.includes("timeout") ||
      msg.includes("abort")
    );
  }
  return false;
}

export async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.slice(7);
    if (!token) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    let payload;
    try {
      const jwks = getJWKS();
      const result = await jwtVerify(token, jwks);
      payload = result.payload;
    } catch (verifyErr) {
      if (isJwksFetchError(verifyErr)) {
        const now = Date.now();
        if (now - lastJwksFetchAttempt > JWKS_RETRY_COOLDOWN) {
          lastJwksFetchAttempt = now;
          JWKS = null;
        }
        res.status(503).json({
          success: false,
          message: "Authentication service temporarily unavailable. Please try again.",
        });
        return;
      }
      throw verifyErr;
    }

    if (!payload.sub) {
      res.status(401).json({ success: false, message: "Invalid token payload" });
      return;
    }

    const userId = payload.sub;

    try {
      const db = getDB();
      const filter: Record<string, unknown> = ObjectId.isValid(userId)
        ? { _id: new ObjectId(userId) }
        : { _id: userId };
      const userExists = await db.collection("user").countDocuments(
        filter,
        { limit: 1 }
      );
      if (!userExists) {
        res.status(401).json({ success: false, message: "User account no longer exists" });
        return;
      }
    } catch {
      // DB lookup failed — proceed with token-only verification
      // rather than blocking all authenticated requests
    }

    req.user = {
      userId,
      role: (payload.role as AuthPayload["role"]) ?? "user",
    };

    next();
  } catch (err) {
    const isExpired =
      err instanceof Error &&
      "code" in err &&
      (err as Error & { code: string }).code === "ERR_JWT_EXPIRED";
    const message = isExpired ? "Token expired" : "Unauthorized access";
    res.status(401).json({ success: false, message });
  }
}
