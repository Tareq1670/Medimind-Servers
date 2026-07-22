import { Request, Response } from "express";

jest.mock("../services/healthRecord.service.js", () => ({
  getHealthRecordByPatientId: jest.fn(),
  createHealthRecord: jest.fn(),
  updateHealthRecord: jest.fn(),
  deleteHealthRecord: jest.fn(),
}));

import * as healthRecordService from "../services/healthRecord.service.js";
import * as healthRecordController from "../controllers/healthRecord.controller.js";

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

describe("HealthRecord Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMyHealthRecord", () => {
    it("should return the health record when found", async () => {
      const record = { _id: "123", patientId: "user123", chronicConditions: ["Asthma"] };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(record);

      const req = { user: { userId: "user123", role: "user" } } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getMyHealthRecord(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: record,
      });
    });

    it("should return 404 when not found", async () => {
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(null);

      const req = { user: { userId: "user123", role: "user" } } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getMyHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(404);
    });

    it("should return 401 when not authenticated", async () => {
      const req = { user: null } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getMyHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("getHealthRecordByPatientId", () => {
    it("should allow patient to view their own record", async () => {
      const record = { _id: "123", patientId: "user123" };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(record);

      const req = {
        params: { patientId: "user123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getHealthRecordByPatientId(req, res as Response);

      expect(res.statusCode).toBe(200);
    });

    it("should return 403 when unauthorized user tries to view", async () => {
      const req = {
        params: { patientId: "other-user" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getHealthRecordByPatientId(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to view any record", async () => {
      const record = { _id: "123", patientId: "other-user" };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(record);

      const req = {
        params: { patientId: "other-user" },
        user: { userId: "admin123", role: "admin" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.getHealthRecordByPatientId(req, res as Response);

      expect(res.statusCode).toBe(200);
    });
  });

  describe("createHealthRecord", () => {
    it("should create a health record", async () => {
      const newRecord = { _id: "123", patientId: "user123", chronicConditions: [] };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(null);
      (healthRecordService.createHealthRecord as jest.Mock).mockResolvedValue(newRecord);

      const req = {
        user: { userId: "user123", role: "user" },
        body: { chronicConditions: [] },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.createHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(201);
    });

    it("should return 409 when record already exists", async () => {
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue({ _id: "existing" });

      const req = {
        user: { userId: "user123", role: "user" },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.createHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(409);
    });
  });

  describe("updateHealthRecord", () => {
    it("should update when record exists", async () => {
      const updated = { _id: "123", patientId: "user123", chronicConditions: ["Diabetes"] };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue({ _id: "123" });
      (healthRecordService.updateHealthRecord as jest.Mock).mockResolvedValue(updated);

      const req = {
        user: { userId: "user123", role: "user" },
        body: { chronicConditions: ["Diabetes"] },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.updateHealthRecord(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Health record updated",
        data: updated,
      });
    });

    it("should return 404 when no record to update", async () => {
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(null);

      const req = {
        user: { userId: "user123", role: "user" },
        body: {},
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.updateHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteHealthRecord", () => {
    it("should delete own record", async () => {
      const record = { _id: "123", patientId: "user123" };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(record);
      (healthRecordService.deleteHealthRecord as jest.Mock).mockResolvedValue(true);

      const req = {
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.deleteHealthRecord(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Health record deleted",
        data: null,
      });
    });

    it("should return 403 when trying to delete another's record", async () => {
      const record = { _id: "123", patientId: "other-user" };
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(record);

      const req = {
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.deleteHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when record not found", async () => {
      (healthRecordService.getHealthRecordByPatientId as jest.Mock).mockResolvedValue(null);

      const req = {
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await healthRecordController.deleteHealthRecord(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });
});
