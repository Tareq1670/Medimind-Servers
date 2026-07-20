import { Request, Response } from "express";

jest.mock("../services/doctor.service.js", () => ({
  getAllDoctors: jest.fn(),
  getDoctorById: jest.fn(),
  createDoctor: jest.fn(),
  updateDoctor: jest.fn(),
  deleteDoctor: jest.fn(),
}));

import * as doctorService from "../services/doctor.service.js";
import * as doctorController from "../controllers/doctor.controller.js";

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

describe("Doctor Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllDoctors", () => {
    it("should return paginated doctors", async () => {
      const mockResult = {
        doctors: [{ _id: "1", name: "Dr. Smith" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (doctorService.getAllDoctors as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await doctorController.getAllDoctors(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });

    it("should handle errors", async () => {
      (doctorService.getAllDoctors as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await doctorController.getAllDoctors(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("getDoctorById", () => {
    it("should return doctor when found", async () => {
      const mockDoctor = { _id: "123", name: "Dr. Smith" };
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(mockDoctor);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await doctorController.getDoctorById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockDoctor,
      });
    });

    it("should return 404 when not found", async () => {
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await doctorController.getDoctorById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createDoctor", () => {
    it("should create doctor when authenticated", async () => {
      const mockDoctor = { _id: "123", name: "Dr. New" };
      (doctorService.createDoctor as jest.Mock).mockResolvedValue(mockDoctor);

      const req = {
        body: { name: "Dr. New", specialization: "Cardiology" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await doctorController.createDoctor(req, res as Response);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Doctor profile created",
        data: mockDoctor,
      });
    });

    it("should return 401 when not authenticated", async () => {
      const req = {
        body: { name: "Dr. New" },
        user: undefined,
      } as unknown as Request;
      const res = mockRes();

      await doctorController.createDoctor(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("updateDoctor", () => {
    it("should update when owner", async () => {
      const existing = { _id: "123", userId: "user123" };
      const updated = { _id: "123", name: "Updated" };
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(existing);
      (doctorService.updateDoctor as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        body: { name: "Updated" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await doctorController.updateDoctor(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Doctor updated",
        data: updated,
      });
    });

    it("should return 403 when not owner and not admin", async () => {
      const existing = { _id: "123", userId: "other-user" };
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(existing);

      const req = {
        params: { id: "123" },
        body: { name: "Updated" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await doctorController.updateDoctor(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should allow admin to update any doctor", async () => {
      const existing = { _id: "123", userId: "other-user" };
      const updated = { _id: "123", name: "Updated" };
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(existing);
      (doctorService.updateDoctor as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        body: { name: "Updated" },
        user: { userId: "admin123", role: "admin" },
      } as unknown as Request;
      const res = mockRes();

      await doctorController.updateDoctor(req, res as Response);

      expect(res.statusCode).toBe(200);
    });

    it("should return 404 when doctor not found", async () => {
      (doctorService.getDoctorById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        body: { name: "Updated" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await doctorController.updateDoctor(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteDoctor", () => {
    it("should delete when found", async () => {
      (doctorService.deleteDoctor as jest.Mock).mockResolvedValue(true);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await doctorController.deleteDoctor(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Doctor deleted",
        data: null,
      });
    });

    it("should return 404 when not found", async () => {
      (doctorService.deleteDoctor as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await doctorController.deleteDoctor(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });
});
