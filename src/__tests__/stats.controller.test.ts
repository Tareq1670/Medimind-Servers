import { Request, Response } from "express";

jest.mock("../services/stats.service.js", () => ({
  getDashboardStats: jest.fn(),
  getDoctorDashboardStats: jest.fn(),
  getUserDashboardStats: jest.fn(),
}));

import * as statsService from "../services/stats.service.js";
import * as statsController from "../controllers/stats.controller.js";

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

describe("Stats Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboard", () => {
    it("should return admin dashboard for admin role", async () => {
      const mockStats = { admin: { totalUsers: 10 } };
      (statsService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const req = { query: { role: "admin" }, user: { userId: "admin1", role: "admin" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockStats });
    });

    it("should return 403 when non-admin requests admin dashboard", async () => {
      const req = { query: { role: "admin" }, user: { userId: "user1", role: "user" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 403 when user requests doctor dashboard", async () => {
      const req = { query: { role: "doctor" }, user: { userId: "user1", role: "user" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to view doctor dashboard", async () => {
      const mockStats = { doctor: { patientCount: 5 } };
      (statsService.getDoctorDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const req = { query: { role: "doctor" }, user: { userId: "admin1", role: "admin" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockStats });
    });

    it("should return doctor dashboard for doctor role", async () => {
      const mockStats = { doctor: { patientCount: 3 } };
      (statsService.getDoctorDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const req = { query: { role: "doctor" }, user: { userId: "doc1", role: "doctor" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(statsService.getDoctorDashboardStats).toHaveBeenCalledWith("doc1");
      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockStats });
    });

    it("should return user dashboard by default", async () => {
      const mockStats = { user: { healthScore: 85 } };
      (statsService.getUserDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const req = { query: {}, user: { userId: "user1", role: "user" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(statsService.getUserDashboardStats).toHaveBeenCalledWith("user1");
      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockStats });
    });

    it("should return 401 when missing userId for user dashboard", async () => {
      const req = { query: {}, user: { role: "user" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should handle errors", async () => {
      (statsService.getDashboardStats as jest.Mock).mockRejectedValue(new Error("Stats error"));

      const req = { query: { role: "admin" }, user: { userId: "admin1", role: "admin" } } as unknown as Request;
      const res = mockRes();

      await statsController.getDashboard(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("getAnalytics", () => {
    it("should return dashboard stats", async () => {
      const mockStats = { admin: { totalUsers: 10 } };
      (statsService.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const req = {} as unknown as Request;
      const res = mockRes();

      await statsController.getAnalytics(req, res as Response);

      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockStats });
    });

    it("should handle errors", async () => {
      (statsService.getDashboardStats as jest.Mock).mockRejectedValue(new Error("Analytics error"));

      const req = {} as unknown as Request;
      const res = mockRes();

      await statsController.getAnalytics(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });
});
