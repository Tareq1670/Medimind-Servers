import { Request, Response } from "express";

jest.mock("../services/healthCondition.service.js", () => ({
  getAllConditions: jest.fn(),
  getConditionById: jest.fn(),
  createCondition: jest.fn(),
  updateCondition: jest.fn(),
  deleteCondition: jest.fn(),
}));

import * as conditionService from "../services/healthCondition.service.js";
import * as conditionController from "../controllers/healthCondition.controller.js";

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

describe("HealthCondition Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllConditions", () => {
    it("should return paginated conditions", async () => {
      const result = {
        data: [{ _id: "1", title: "Diabetes" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (conditionService.getAllConditions as jest.Mock).mockResolvedValue(result);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await conditionController.getAllConditions(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: result,
      });
    });

    it("should handle errors", async () => {
      (conditionService.getAllConditions as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await conditionController.getAllConditions(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("getConditionById", () => {
    it("should return condition when found", async () => {
      const condition = { _id: "123", title: "Diabetes" };
      (conditionService.getConditionById as jest.Mock).mockResolvedValue(condition);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await conditionController.getConditionById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: condition,
      });
    });

    it("should return 404 when not found", async () => {
      (conditionService.getConditionById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await conditionController.getConditionById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createCondition", () => {
    it("should create a condition", async () => {
      const newCondition = { _id: "123", title: "Diabetes", severity: "High" };
      (conditionService.createCondition as jest.Mock).mockResolvedValue(newCondition);

      const req = {
        body: { title: "Diabetes", severity: "High" },
      } as unknown as Request;
      const res = mockRes();

      await conditionController.createCondition(req, res as Response);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Condition created",
        data: newCondition,
      });
    });
  });

  describe("updateCondition", () => {
    it("should update when found", async () => {
      const updated = { _id: "123", title: "Diabetes Type 2" };
      (conditionService.updateCondition as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        body: { title: "Diabetes Type 2" },
      } as unknown as Request;
      const res = mockRes();

      await conditionController.updateCondition(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Condition updated",
        data: updated,
      });
    });

    it("should return 404 when not found", async () => {
      (conditionService.updateCondition as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        body: { title: "Test" },
      } as unknown as Request;
      const res = mockRes();

      await conditionController.updateCondition(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteCondition", () => {
    it("should delete when found", async () => {
      (conditionService.deleteCondition as jest.Mock).mockResolvedValue(true);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await conditionController.deleteCondition(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Condition deleted",
        data: null,
      });
    });

    it("should return 404 when not found", async () => {
      (conditionService.deleteCondition as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await conditionController.deleteCondition(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });
});
