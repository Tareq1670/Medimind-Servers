import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validateRequest.js";

const testSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

const querySchema = z.object({
  body: z.object({}).default({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
  params: z.object({}).default({}),
});

describe("validateRequest middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  it("should call next with valid data", () => {
    mockReq.body = { name: "Test", email: "test@example.com" };
    const middleware = validateRequest(testSchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should return 400 with invalid data", () => {
    mockReq.body = { name: "", email: "not-an-email" };
    const middleware = validateRequest(testSchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "Validation failed",
      })
    );
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("should return 400 when body is missing required fields", () => {
    mockReq.body = {};
    const middleware = validateRequest(testSchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should coerce query parameters", () => {
    mockReq.query = { page: "3", limit: "20" };
    const middleware = validateRequest(querySchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
    expect(mockReq.query).toEqual({ page: 3, limit: 20 });
  });

  it("should use default values for query parameters", () => {
    mockReq.query = {};
    const middleware = validateRequest(querySchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
    expect(mockReq.query).toEqual({ page: 1, limit: 10 });
  });

  it("should reject query parameter exceeding max limit", () => {
    mockReq.query = { limit: "200" };
    const middleware = validateRequest(querySchema);
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });
});
