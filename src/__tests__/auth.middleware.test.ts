import { Request, Response, NextFunction } from "express";

jest.mock("jose-cjs", () => ({
  createRemoteJWKSet: jest.fn(),
  jwtVerify: jest.fn(),
}));

jest.mock("../config/db.js", () => ({
  getDB: jest.fn(),
}));

jest.mock("../config/env.js", () => ({
  env: { jwksUri: "https://example.com/.well-known/jwks.json" },
}));

import { verifyToken } from "../middleware/auth.middleware.js";
import { getDB } from "../config/db.js";
import { jwtVerify, createRemoteJWKSet } from "jose-cjs";

const MOCK_USER_ID = "507f1f77bcf86cd799439011";

function mockReqRes(): { req: Partial<Request>; res: Partial<Response> & { statusCode?: number; jsonData?: unknown }; next: NextFunction } {
  const res: Partial<Response> & { statusCode?: number; jsonData?: unknown } = {
    status: jest.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation((data: unknown) => {
      res.jsonData = data;
      return res;
    }),
  };
  const next = jest.fn();
  return { req: {}, res, next };
}

function setupValidJwt(payload: Record<string, unknown> = {}) {
  (jwtVerify as jest.Mock).mockResolvedValue({
    payload: { sub: MOCK_USER_ID, role: "user", ...payload },
  });
}

describe("Auth Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createRemoteJWKSet as jest.Mock).mockReturnValue({});
  });

  it("should return 401 when no authorization header", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = {};

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect((res.jsonData as Record<string, unknown>).message).toBe("No token provided");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when header does not start with Bearer", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Basic abc123" };

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should set req.user and call next when token is valid", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer valid.jwt.token" };
    setupValidJwt();

    const mockCollection = { countDocuments: jest.fn().mockResolvedValue(1) };
    const mockDB = { collection: jest.fn().mockReturnValue(mockCollection) };
    (getDB as jest.Mock).mockReturnValue(mockDB);

    await verifyToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: MOCK_USER_ID, role: "user" });
  });

  it("should return 401 when user does not exist in DB", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer valid.jwt.token" };
    setupValidJwt();

    const mockCollection = { countDocuments: jest.fn().mockResolvedValue(0) };
    const mockDB = { collection: jest.fn().mockReturnValue(mockCollection) };
    (getDB as jest.Mock).mockReturnValue(mockDB);

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect((res.jsonData as Record<string, unknown>).message).toBe("User account no longer exists");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 503 when DB is unavailable", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer valid.jwt.token" };
    setupValidJwt();

    const mockCollection = { countDocuments: jest.fn().mockRejectedValue(new Error("Connection refused")) };
    const mockDB = { collection: jest.fn().mockReturnValue(mockCollection) };
    (getDB as jest.Mock).mockReturnValue(mockDB);

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(503);
    expect((res.jsonData as Record<string, unknown>).message).toBe("Database unavailable");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is expired", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer expired.token" };

    const err = new Error("Token expired");
    (err as Error & { code: string }).code = "ERR_JWT_EXPIRED";
    (jwtVerify as jest.Mock).mockRejectedValue(err);

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect((res.jsonData as Record<string, unknown>).message).toBe("Token expired");
  });

  it("should return 401 for general verification errors", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer bad.token" };

    (jwtVerify as jest.Mock).mockRejectedValue(new Error("Invalid signature"));

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect((res.jsonData as Record<string, unknown>).message).toBe("Unauthorized access");
  });

  it("should return 503 when JWKS fetch fails", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer token" };

    (jwtVerify as jest.Mock).mockRejectedValue(new Error("fetch failed"));

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(503);
    expect((res.jsonData as Record<string, unknown>).message).toBe(
      "Authentication service temporarily unavailable. Please try again."
    );
  });

  it("should return 401 when token has no sub claim", async () => {
    const { req, res, next } = mockReqRes();
    req.headers = { authorization: "Bearer token" };

    (jwtVerify as jest.Mock).mockResolvedValue({
      payload: { role: "user" },
    });

    await verifyToken(req as Request, res as Response, next);

    expect(res.statusCode).toBe(401);
    expect((res.jsonData as Record<string, unknown>).message).toBe("Invalid token payload");
  });
});
