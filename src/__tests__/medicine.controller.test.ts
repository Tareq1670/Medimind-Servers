import { Request, Response } from "express";
import { ObjectId } from "mongodb";

jest.mock("../services/medicine.service.js", () => ({
  getAllMedicines: jest.fn(),
  getMedicineById: jest.fn(),
  createMedicine: jest.fn(),
  updateMedicine: jest.fn(),
  deleteMedicine: jest.fn(),
  searchMedicines: jest.fn(),
  getCategories: jest.fn(),
  getFeaturedMedicines: jest.fn(),
}));

jest.mock("../services/upload.service.js", () => ({
  uploadToImageBB: jest.fn().mockResolvedValue("https://example.com/uploaded.jpg"),
}));

import * as medicineService from "../services/medicine.service.js";
import * as medicineController from "../controllers/medicine.controller.js";

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

describe("Medicine Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMedicines", () => {
    it("should return paginated medicines", async () => {
      const mockResult = {
        medicines: [{ _id: "1", name: "Aspirin" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (medicineService.getAllMedicines as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: { page: 1, limit: 10 } } as unknown as Request;
      const res = mockRes();

      await medicineController.getAllMedicines(req, res as Response);

      expect(medicineService.getAllMedicines).toHaveBeenCalledWith({ page: 1, limit: 10 });
      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });

    it("should handle errors", async () => {
      (medicineService.getAllMedicines as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await medicineController.getAllMedicines(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "DB error",
      });
    });
  });

  describe("getMedicineById", () => {
    it("should return medicine when found", async () => {
      const mockMedicine = { _id: "123", name: "Aspirin" };
      (medicineService.getMedicineById as jest.Mock).mockResolvedValue(mockMedicine);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await medicineController.getMedicineById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockMedicine,
      });
    });

    it("should return 404 when not found", async () => {
      (medicineService.getMedicineById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await medicineController.getMedicineById(req, res as Response);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Medicine not found",
      });
    });
  });

  describe("createMedicine", () => {
    it("should create medicine successfully", async () => {
      const mockMedicine = { _id: "123", name: "New Medicine" };
      (medicineService.createMedicine as jest.Mock).mockResolvedValue(mockMedicine);

      const req = {
        body: { name: "New Medicine", genericName: "Test", category: "Test", manufacturer: "Test", price: 10, description: "Test" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await medicineController.createMedicine(req, res as Response);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Medicine created",
        data: mockMedicine,
      });
    });

    it("should handle creation errors", async () => {
      (medicineService.createMedicine as jest.Mock).mockRejectedValue(new Error("Duplicate key"));

      const req = { body: { name: "Test" }, file: null } as unknown as Request;
      const res = mockRes();

      await medicineController.createMedicine(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("updateMedicine", () => {
    it("should update medicine when found", async () => {
      const mockUpdated = { _id: "123", name: "Updated" };
      (medicineService.updateMedicine as jest.Mock).mockResolvedValue(mockUpdated);

      const req = {
        params: { id: "123" },
        body: { name: "Updated" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await medicineController.updateMedicine(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Medicine updated",
        data: mockUpdated,
      });
    });

    it("should return 404 when not found", async () => {
      (medicineService.updateMedicine as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        body: { name: "Updated" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await medicineController.updateMedicine(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteMedicine", () => {
    it("should delete medicine when found", async () => {
      (medicineService.deleteMedicine as jest.Mock).mockResolvedValue(true);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await medicineController.deleteMedicine(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Medicine deleted",
        data: null,
      });
    });

    it("should return 404 when not found", async () => {
      (medicineService.deleteMedicine as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await medicineController.deleteMedicine(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("searchMedicines", () => {
    it("should search medicines with query", async () => {
      const mockResult = { medicines: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      (medicineService.searchMedicines as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: { q: "aspirin", page: "1", limit: "10" } } as unknown as Request;
      const res = mockRes();

      await medicineController.searchMedicines(req, res as Response);

      expect(medicineService.searchMedicines).toHaveBeenCalledWith("aspirin", 1, 10);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });

    it("should return 400 without search query", async () => {
      const req = { query: { q: "" } } as unknown as Request;
      const res = mockRes();

      await medicineController.searchMedicines(req, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Search query is required",
      });
    });
  });

  describe("getCategories", () => {
    it("should return categories", async () => {
      const categories = ["Painkillers", "Antibiotics", "Vitamins"];
      (medicineService.getCategories as jest.Mock).mockResolvedValue(categories);

      const req = {} as unknown as Request;
      const res = mockRes();

      await medicineController.getCategories(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: categories,
      });
    });
  });

  describe("getFeaturedMedicines", () => {
    it("should return featured medicines", async () => {
      const medicines = [{ name: "Featured 1" }, { name: "Featured 2" }];
      (medicineService.getFeaturedMedicines as jest.Mock).mockResolvedValue(medicines);

      const req = { query: { limit: "2" } } as unknown as Request;
      const res = mockRes();

      await medicineController.getFeaturedMedicines(req, res as Response);

      expect(medicineService.getFeaturedMedicines).toHaveBeenCalledWith(2);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: medicines,
      });
    });
  });
});
