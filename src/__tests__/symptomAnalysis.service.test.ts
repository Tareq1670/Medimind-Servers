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
const mockUsersFind = jest.fn();
const mockUsersToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  symptomAnalysesCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
  })),
  usersCol: jest.fn(() => ({
    find: mockUsersFind,
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

import * as symptomService from "../services/symptomAnalysis.service.js";

describe("symptomAnalysis.service", () => {
  const mockUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockUsersFind.mockReturnValue({ toArray: mockUsersToArray });
    mockUsersToArray.mockResolvedValue([]);
  });

  describe("getAllAnalyses", () => {
    it("should return paginated analyses for admin", async () => {
      const data = [{ _id: new ObjectId(), patientId: mockUserId }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await symptomService.getAllAnalyses({ page: 1, limit: 10, userId: mockUserId, isAdmin: true });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should filter by patientId for non-admin users", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await symptomService.getAllAnalyses({ page: 1, limit: 10, userId: mockUserId, isAdmin: false });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ patientId: mockUserId }]) })
      );
    });
  });

  describe("getAnalysisById", () => {
    it("should find by ID", async () => {
      const analysis = { _id: new ObjectId(), patientId: mockUserId };
      mockFindOne.mockResolvedValue(analysis);

      const result = await symptomService.getAnalysisById("507f1f77bcf86cd799439011");

      expect(result).toEqual(analysis);
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await symptomService.getAnalysisById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createAnalysis", () => {
    it("should create a new analysis", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { patientId: mockUserId, reportedSymptoms: ["Fever", "Cough"] };
      const result = await symptomService.createAnalysis(data);

      expect(result._id).toEqual(insertedId);
      expect(result.reportedSymptoms).toEqual(["Fever", "Cough"]);
    });
  });

  describe("updateAnalysis", () => {
    it("should update and return the analysis", async () => {
      const updated = { _id: new ObjectId(), patientId: mockUserId, severity: "High" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await symptomService.updateAnalysis("507f1f77bcf86cd799439011", { severity: "High" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await symptomService.updateAnalysis("507f1f77bcf86cd799439011", { _id: "remove" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("deleteAnalysis", () => {
    it("should delete and return the analysis", async () => {
      const deleted = { _id: new ObjectId(), patientId: mockUserId };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await symptomService.deleteAnalysis("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });
});
