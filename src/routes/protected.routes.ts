import { Router, Request, Response } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", verifyToken, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Protected resource accessed successfully",
    user: req.user,
  });
});

export default router;
