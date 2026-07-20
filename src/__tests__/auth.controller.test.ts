import { Request, Response } from "express";

jest.mock("../services/user.service.js", () => ({
  getAllUsers: jest.fn(),
}));

import * as userService from "../services/user.service.js";
import * as authController from "../controllers/auth.controller.js";

function mockRes(): Partial<Response> & { statusCode?: number; jsonData?: unknown } {
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
  return res;
}

describe("Auth Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getProfile", () => {
    it("should return user profile when authenticated", async () => {
      const req = {
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      authController.getProfile(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: {
          user: { userId: "user123", role: "user" },
          message: "Authenticated via Better Auth JWT verified by JWKS.",
        },
      });
    });
  });

  describe("register", () => {
    it("should return 501 (stub)", async () => {
      const req = {} as unknown as Request;
      const res = mockRes();

      await authController.register(req, res as Response);

      expect(res.statusCode).toBe(501);
    });
  });

  describe("login", () => {
    it("should return 501 (stub)", async () => {
      const req = {} as unknown as Request;
      const res = mockRes();

      await authController.login(req, res as Response);

      expect(res.statusCode).toBe(501);
    });
  });

  describe("logout", () => {
    it("should return success", async () => {
      const req = {} as unknown as Request;
      const res = mockRes();

      await authController.logout(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Logged out successfully. Clear client-side tokens.",
        data: null,
      });
    });
  });

  describe("getAllUsers", () => {
    it("should return paginated users", async () => {
      const mockResult = {
        users: [{ _id: "1", name: "Test User" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (userService.getAllUsers as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await authController.getAllUsers(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });

    it("should handle errors", async () => {
      (userService.getAllUsers as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await authController.getAllUsers(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });
});
