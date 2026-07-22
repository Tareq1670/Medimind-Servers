import { Request, Response, NextFunction } from "express";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

describe("authorizeRoles middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
  });

  it("should return 401 if user is not authenticated", () => {
    const middleware = authorizeRoles("admin");
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Not authenticated",
    });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("should return 403 if user role is not allowed", () => {
    mockReq.user = { userId: "123", role: "user" };
    const middleware = authorizeRoles("admin", "doctor");
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      message: "Forbidden: requires one of [admin, doctor] roles",
    });
    expect(nextFn).not.toHaveBeenCalled();
  });

  it("should call next if user role is allowed", () => {
    mockReq.user = { userId: "123", role: "admin" };
    const middleware = authorizeRoles("admin", "doctor");
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it("should work with single allowed role", () => {
    mockReq.user = { userId: "123", role: "doctor" };
    const middleware = authorizeRoles("doctor");
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });

  it("should work with all three roles", () => {
    mockReq.user = { userId: "123", role: "user" };
    const middleware = authorizeRoles("user", "doctor", "admin");
    middleware(mockReq as Request, mockRes as Response, nextFn);
    expect(nextFn).toHaveBeenCalled();
  });
});
