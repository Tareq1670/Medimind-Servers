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

jest.mock("../db/collections.js", () => ({
  conditionsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
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

import * as conditionService from "../services/healthCondition.service.js";

describe("healthCondition.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
  });

  describe("getAllConditions", () => {
    it("should return paginated results without filters", async () => {
      const data = [{ _id: new ObjectId(), title: "Diabetes" }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await conditionService.getAllConditions({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply search filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await conditionService.getAllConditions({ page: 1, limit: 10, search: "diabetes" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply severity filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await conditionService.getAllConditions({ page: 1, limit: 10, severity: "High" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ severity: "High" }]) })
      );
    });

    it("should use default sort by title descending", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await conditionService.getAllConditions({ page: 1, limit: 10 });

      expect(mockSort).toHaveBeenCalledWith({ title: -1 });
    });

    it("should sort by createdAt descending when specified", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await conditionService.getAllConditions({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" });

      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe("getConditionById", () => {
    it("should find by ID", async () => {
      const condition = { _id: new ObjectId(), title: "Diabetes" };
      mockFindOne.mockResolvedValue(condition);

      const result = await conditionService.getConditionById("507f1f77bcf86cd799439011");

      expect(result).toEqual(condition);
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await conditionService.getConditionById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createCondition", () => {
    it("should create a new condition", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { title: "Hypertension", description: "High blood pressure", symptoms: ["Headache"], severity: "High", precautions: ["Reduce salt"] };
      const result = await conditionService.createCondition(data);

      expect(result._id).toEqual(insertedId);
      expect(result.title).toBe("Hypertension");
      expect(result.severity).toBe("High");
    });

    it("should use empty arrays for missing optional fields", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await conditionService.createCondition({ title: "Test" });

      expect(result.symptoms).toEqual([]);
      expect(result.precautions).toEqual([]);
    });
  });

  describe("updateCondition", () => {
    it("should update and return the condition", async () => {
      const updated = { _id: new ObjectId(), title: "Hypertension Updated" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await conditionService.updateCondition("507f1f77bcf86cd799439011", { title: "Hypertension Updated" });

      expect(result).toEqual(updated);
    });

    it("should return null when not found", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      const result = await conditionService.updateCondition("507f1f77bcf86cd799439011", { title: "Nope" });

      expect(result).toBeNull();
    });
  });

  describe("deleteCondition", () => {
    it("should delete and return the condition", async () => {
      const deleted = { _id: new ObjectId(), title: "To Delete" };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await conditionService.deleteCondition("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });

    it("should return null when not found", async () => {
      mockFindOneAndDelete.mockResolvedValue(null);

      const result = await conditionService.deleteCondition("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });
});
