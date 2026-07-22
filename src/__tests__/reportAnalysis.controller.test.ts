import { Request, Response } from "express";

jest.mock("../services/reportAnalysis.service.js", () => ({
  getAllReports: jest.fn(),
  getReportById: jest.fn(),
  createReport: jest.fn(),
  updateReport: jest.fn(),
  deleteReport: jest.fn(),
}));

jest.mock("../services/upload.service.js", () => ({
  uploadToImageBB: jest.fn(),
}));

import * as reportService from "../services/reportAnalysis.service.js";
import * as reportController from "../controllers/reportAnalysis.controller.js";

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

describe("ReportAnalysis Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllReports", () => {
    it("should return reports for authenticated user", async () => {
      const result = {
        data: [{ _id: "1", reportName: "Blood Test" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (reportService.getAllReports as jest.Mock).mockResolvedValue(result);

      const req = {
        query: {},
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.getAllReports(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: result,
      });
    });

    it("should return 401 when not authenticated", async () => {
      const req = { query: {}, user: null } as unknown as Request;
      const res = mockRes();

      await reportController.getAllReports(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("getReportById", () => {
    it("should return report when found and authorized", async () => {
      const report = { _id: "123", patientId: "user123", reportName: "X-Ray" };
      (reportService.getReportById as jest.Mock).mockResolvedValue(report);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.getReportById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: report,
      });
    });

    it("should return 403 when unauthorized", async () => {
      const report = { _id: "123", patientId: "other-user" };
      (reportService.getReportById as jest.Mock).mockResolvedValue(report);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.getReportById(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when not found", async () => {
      (reportService.getReportById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.getReportById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createReport", () => {
    it("should create a report", async () => {
      const newReport = { _id: "123", patientId: "user123", reportName: "MRI" };
      (reportService.createReport as jest.Mock).mockResolvedValue(newReport);

      const req = {
        user: { userId: "user123", role: "user" },
        body: { reportName: "MRI", reportType: "imaging" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.createReport(req, res as Response);

      expect(res.statusCode).toBe(201);
    });
  });

  describe("updateReport", () => {
    it("should update when authorized", async () => {
      const report = { _id: "123", patientId: "user123" };
      const updated = { ...report, reportName: "Updated MRI" };
      (reportService.getReportById as jest.Mock).mockResolvedValue(report);
      (reportService.updateReport as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: { reportName: "Updated MRI" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.updateReport(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Report updated",
        data: updated,
      });
    });

    it("should return 404 when not found", async () => {
      (reportService.getReportById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        user: { userId: "user123", role: "user" },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await reportController.updateReport(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteReport", () => {
    it("should delete own report", async () => {
      const report = { _id: "123", patientId: "user123" };
      (reportService.getReportById as jest.Mock).mockResolvedValue(report);
      (reportService.deleteReport as jest.Mock).mockResolvedValue(true);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.deleteReport(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Report deleted",
        data: null,
      });
    });

    it("should return 403 when unauthorized", async () => {
      const report = { _id: "123", patientId: "other-user" };
      (reportService.getReportById as jest.Mock).mockResolvedValue(report);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reportController.deleteReport(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });
});
