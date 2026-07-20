import request from "supertest";
import express, { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());

app.get("/api/v1/health", async (_req: Request, res: Response) => {
  try {
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
      medicines: "/api/v1/medicines",
    },
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.redirect("/api/v1/health");
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

describe("Basic API Routes (no DB required)", () => {
  describe("GET /", () => {
    it("should return API info with endpoints", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("MediMind API");
      expect(res.body.version).toBe("1.0.0");
      expect(res.body.endpoints).toHaveProperty("health");
      expect(res.body.endpoints).toHaveProperty("medicines");
    });
  });

  describe("GET /api/v1/health", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("MediMind");
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/api/v1/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Route not found");
    });
  });
});
