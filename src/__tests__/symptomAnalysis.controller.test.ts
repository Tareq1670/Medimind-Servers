import { Request, Response } from "express";

jest.mock("../services/symptomAnalysis.service.js", () => ({
  getAllAnalyses: jest.fn(),
  getAnalysisById: jest.fn(),
  createAnalysis: jest.fn(),
  updateAnalysis: jest.fn(),
  deleteAnalysis: jest.fn(),
}));

import * as symptomService from "../services/symptomAnalysis.service.js";
import * as symptomController from "../controllers/symptomAnalysis.controller.js";

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

describe("SymptomAnalysis Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllAnalyses", () => {
    it("should return analyses for authenticated user", async () => {
      const result = {
        data: [{ _id: "1", reportedSymptoms: ["Headache"] }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (symptomService.getAllAnalyses as jest.Mock).mockResolvedValue(result);

      const req = {
        query: {},
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.getAllAnalyses(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: result,
      });
    });

    it("should return 401 when not authenticated", async () => {
      const req = { query: {}, user: null } as unknown as Request;
      const res = mockRes();

      await symptomController.getAllAnalyses(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("getAnalysisById", () => {
    it("should return analysis when found and authorized", async () => {
      const analysis = { _id: "123", patientId: "user123" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.getAnalysisById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: analysis,
      });
    });

    it("should return 403 when unauthorized", async () => {
      const analysis = { _id: "123", patientId: "other-user" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.getAnalysisById(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to view any analysis", async () => {
      const analysis = { _id: "123", patientId: "other-user" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);

      const req = {
        params: { id: "123" },
        user: { userId: "admin123", role: "admin" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.getAnalysisById(req, res as Response);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 when not found", async () => {
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.getAnalysisById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createAnalysis", () => {
    it("should create an analysis", async () => {
      const newAnalysis = { _id: "123", patientId: "user123", reportedSymptoms: ["Fever"] };
      (symptomService.createAnalysis as jest.Mock).mockResolvedValue(newAnalysis);

      const req = {
        user: { userId: "user123", role: "user" },
        body: { reportedSymptoms: ["Fever"], duration: "3 days" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.createAnalysis(req, res as Response);

      expect(res.statusCode).toBe(201);
    });
  });

  describe("updateAnalysis", () => {
    it("should update when authorized", async () => {
      const analysis = { _id: "123", patientId: "user123" };
      const updated = { ...analysis, reportedSymptoms: ["Fever", "Cough"] };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);
      (symptomService.updateAnalysis as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: { reportedSymptoms: ["Fever", "Cough"] },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.updateAnalysis(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Analysis updated",
        data: updated,
      });
    });

    it("should return 403 when unauthorized", async () => {
      const analysis = { _id: "123", patientId: "other-user" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await symptomController.updateAnalysis(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("deleteAnalysis", () => {
    it("should delete own analysis", async () => {
      const analysis = { _id: "123", patientId: "user123" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);
      (symptomService.deleteAnalysis as jest.Mock).mockResolvedValue(true);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.deleteAnalysis(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Analysis deleted",
        data: null,
      });
    });

    it("should return 403 when unauthorized", async () => {
      const analysis = { _id: "123", patientId: "other-user" };
      (symptomService.getAnalysisById as jest.Mock).mockResolvedValue(analysis);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await symptomController.deleteAnalysis(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });
});
