import { Request, Response, NextFunction } from "express";
import { UserRole } from "../types/auth.js";

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${allowedRoles.join(", ")}] roles`,
      });
      return;
    }
    next();
  };
}
