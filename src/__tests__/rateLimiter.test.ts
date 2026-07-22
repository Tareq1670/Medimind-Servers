import request from "supertest";
import express from "express";
import { aiRateLimiter, generalRateLimiter } from "../middleware/rateLimiter.js";

function createTestApp(limiter: ReturnType<typeof express.Router.use extends (req: any, ...args: any[]) => any ? any : any>) {
  const app = express();
  app.use(limiter);
  app.get("/test", (_req: express.Request, res: express.Response) => {
    res.json({ success: true });
  });
  return app;
}

describe("aiRateLimiter", () => {
  it("should allow requests within limit", async () => {
    const app = createTestApp(aiRateLimiter);

    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("should include rate limit headers", async () => {
    const app = createTestApp(aiRateLimiter);

    const res = await request(app).get("/test");

    expect(res.headers["ratelimit-limit"]).toBeDefined();
    expect(res.headers["ratelimit-remaining"]).toBeDefined();
  });

  it("should block requests exceeding the limit", async () => {
    const app = createTestApp(aiRateLimiter);

    for (let i = 0; i < 10; i++) {
      await request(app).get("/test");
    }

    const res = await request(app).get("/test");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many AI requests. Please slow down and try again in a minute.",
    });
  }, 30000);
});

describe("generalRateLimiter", () => {
  it("should have correct limit config", async () => {
    const app = createTestApp(generalRateLimiter);

    const res = await request(app).get("/test");

    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBeDefined();
  });

  it("should return proper error message when blocked", async () => {
    const app = createTestApp(generalRateLimiter);

    for (let i = 0; i < 60; i++) {
      await request(app).get("/test");
    }

    const res = await request(app).get("/test");

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  }, 120000);
});
