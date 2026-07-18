import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB, getDB } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  await connectDB();
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/protected", protectedRoutes);

app.get("/api/v1/health", async (_req: Request, res: Response) => {
  try {
    await getDB().command({ ping: 1 });
    res.status(200).json({
      success: true,
      message: "MediMind API Server Skeleton Ready",
    });
  } catch {
    res.status(503).json({
      success: false,
      message: "Database unreachable",
    });
  }
});

app.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "MediMind API",
    endpoints: {
      health: "/api/v1/health",
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.redirect("/api/v1/health");
});

app.get("/favicon.ico", (_req: Request, res: Response) => {
  res.status(204).end();
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
