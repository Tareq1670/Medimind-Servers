import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { connectDB, getDB } from "./config/db.js";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import medicineRoutes from "./routes/medicine.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import healthConditionRoutes from "./routes/healthCondition.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import chatSessionRoutes from "./routes/chatSession.routes.js";
import reportAnalysisRoutes from "./routes/reportAnalysis.routes.js";
import symptomAnalysisRoutes from "./routes/symptomAnalysis.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import recordRoutes from "./routes/record.routes.js";
import healthRecordAliasRoutes from "./routes/healthRecordAlias.routes.js";

const app = express();

const allowedOrigins = [
  env.frontendUrl,
  ...(env.nodeEnv !== "production"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(cookieParser());

let dbConnected = false;

app.use(async (_req: Request, res: Response, next: NextFunction) => {
  if (dbConnected) return next();
  try {
    await connectDB();
    dbConnected = true;
  } catch (err) {
    console.error("DB connection failed:", err);
    res.status(503).json({
      success: false,
      message: "Database unavailable",
    });
    return;
  }
  next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/protected", protectedRoutes);
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/conditions", healthConditionRoutes);
app.use("/api/v1/blogs", blogRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/chat-sessions", chatSessionRoutes);
app.use("/api/v1/report-analyses", reportAnalysisRoutes);
app.use("/api/v1/symptom-analyses", symptomAnalysisRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/stats", statsRoutes);
app.use("/api/v1/records", recordRoutes);
app.use("/api/v1/health-records", healthRecordAliasRoutes);

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
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      auth: "/api/v1/auth",
      protected: "/api/v1/protected",
      medicines: "/api/v1/medicines",
      doctors: "/api/v1/doctors",
      conditions: "/api/v1/conditions",
      blogs: "/api/v1/blogs",
      reviews: "/api/v1/reviews",
      chatSessions: "/api/v1/chat-sessions",
      reportAnalyses: "/api/v1/report-analyses",
      symptomAnalyses: "/api/v1/symptom-analyses",
      ai: "/api/v1/ai",
      upload: "/api/v1/upload",
      stats: "/api/v1/stats",
      records: "/api/v1/records",
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

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message:
      env.nodeEnv === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

export default app;
