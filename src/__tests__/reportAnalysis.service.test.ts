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
  reportAnalysesCol: jest.fn(() => ({
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

import * as reportService from "../services/reportAnalysis.service.js";

describe("reportAnalysis.service", () => {
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

  describe("getAllReports", () => {
    it("should return paginated reports for admin", async () => {
      const data = [{ _id: new ObjectId(), patientId: mockUserId, reportType: "blood" }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await reportService.getAllReports({ page: 1, limit: 10, userId: mockUserId, isAdmin: true });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should filter by patientId for non-admin users", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await reportService.getAllReports({ page: 1, limit: 10, userId: mockUserId, isAdmin: false });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: mockUserId })
      );
    });

    it("should apply report type filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await reportService.getAllReports({ page: 1, limit: 10, userId: mockUserId, isAdmin: true, reportType: "blood" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ reportType: "blood" }]) })
      );
    });
  });

  describe("getReportById", () => {
    it("should find by ID", async () => {
      const report = { _id: new ObjectId(), patientId: mockUserId };
      mockFindOne.mockResolvedValue(report);

      const result = await reportService.getReportById("507f1f77bcf86cd799439011");

      expect(result).toEqual(report);
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await reportService.getReportById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createReport", () => {
    it("should create a new report", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { patientId: mockUserId, reportType: "blood", reportName: "CBC" };
      const result = await reportService.createReport(data);

      expect(result._id).toEqual(insertedId);
      expect(result.reportType).toBe("blood");
    });
  });

  describe("updateReport", () => {
    it("should update and return the report", async () => {
      const updated = { _id: new ObjectId(), patientId: mockUserId, analysisSummary: "Updated" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await reportService.updateReport("507f1f77bcf86cd799439011", { analysisSummary: "Updated" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await reportService.updateReport("507f1f77bcf86cd799439011", { _id: "remove" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("deleteReport", () => {
    it("should delete and return the report", async () => {
      const deleted = { _id: new ObjectId(), patientId: mockUserId };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await reportService.deleteReport("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });
});
