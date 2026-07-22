import { ObjectId } from "mongodb";

const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockSort = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();
const mockToArray = jest.fn();
const mockAggregate = jest.fn();

jest.mock("../db/collections.js", () => ({
  medicinesCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
    aggregate: mockAggregate,
  })),
  toObjectId: jest.fn((id: string) => new ObjectId(id)),
}));

jest.mock("../utils/pagination.js", () => ({
  paginate: jest.fn(),
  andFilter: jest.fn((conds) => conds.length > 0 ? { $and: conds } : {}),
  regexSearch: jest.fn((fields, term) => (
    { $or: fields.map((f: string) => ({ [f]: { $regex: term, $options: "i" } })) }
  )),
}));

import * as medicineService from "../services/medicine.service.js";

describe("medicine.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
  });

  describe("getAllMedicines", () => {
    it("should return paginated results without filters", async () => {
      const data = [{ _id: new ObjectId(), name: "Paracetamol" }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await medicineService.getAllMedicines({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply search filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, search: "para" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply category filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, category: "Painkillers" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ category: "Painkillers" }]) })
      );
    });

    it("should apply price range filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, minPrice: 10, maxPrice: 50 });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply prescription filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, prescription: "true" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ isPrescriptionRequired: true }]) })
      );
    });

    it("should apply stock filter for low stock", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, stock: "low" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ stockQuantity: { $gt: 0, $lt: 10 } }]) })
      );
    });

    it("should apply stock filter for out of stock", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await medicineService.getAllMedicines({ page: 1, limit: 10, stock: "out" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ stockQuantity: 0 }]) })
      );
    });
  });

  describe("getMedicineById", () => {
    it("should find by ID", async () => {
      const medicine = { _id: new ObjectId(), name: "Paracetamol" };
      mockFindOne.mockResolvedValue(medicine);

      const result = await medicineService.getMedicineById("507f1f77bcf86cd799439011");

      expect(result).toEqual(medicine);
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await medicineService.getMedicineById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createMedicine", () => {
    it("should create a new medicine", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { name: "Paracetamol", genericName: "Acetaminophen", category: "Painkillers", manufacturer: "PharmaCo", price: 9.99, stockQuantity: 100, description: "Pain reliever", isPrescriptionRequired: false };
      const result = await medicineService.createMedicine(data);

      expect(result._id).toEqual(insertedId);
      expect(result.name).toBe("Paracetamol");
      expect(result.price).toBe(9.99);
    });

    it("should use defaults for missing fields", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await medicineService.createMedicine({ name: "Test" });

      expect(result.price).toBe(0);
      expect(result.stockQuantity).toBe(0);
      expect(result.isPrescriptionRequired).toBe(false);
    });
  });

  describe("updateMedicine", () => {
    it("should update and return the medicine", async () => {
      const updated = { _id: new ObjectId(), name: "Paracetamol Updated" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await medicineService.updateMedicine("507f1f77bcf86cd799439011", { name: "Paracetamol Updated" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await medicineService.updateMedicine("507f1f77bcf86cd799439011", { _id: "should-remove", name: "Test" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("deleteMedicine", () => {
    it("should delete and return the medicine", async () => {
      const deleted = { _id: new ObjectId(), name: "To Delete" };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await medicineService.deleteMedicine("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });

  describe("searchMedicines", () => {
    it("should search by name", async () => {
      const data = [{ _id: new ObjectId(), name: "Paracetamol" }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await medicineService.searchMedicines("para", 1, 10);

      expect(result.data).toEqual(data);
    });
  });

  describe("getCategories", () => {
    it("should return distinct categories", async () => {
      mockAggregate.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ _id: "Painkillers" }, { _id: "Antibiotics" }]) });

      const result = await medicineService.getCategories();

      expect(result).toEqual(["Painkillers", "Antibiotics"]);
    });
  });

  describe("getFeaturedMedicines", () => {
    it("should return featured medicines", async () => {
      const data = [{ _id: new ObjectId(), name: "Featured Med" }];
      mockFind.mockReturnValue({ sort: mockSort });
      mockSort.mockReturnValue({ limit: mockLimit });
      mockLimit.mockReturnValue({ toArray: mockToArray });
      mockToArray.mockResolvedValue(data);

      const result = await medicineService.getFeaturedMedicines();

      expect(result).toEqual(data);
    });
  });
});
