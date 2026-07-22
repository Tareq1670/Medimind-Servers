import { ObjectId } from "mongodb";

const mockFindOneAndUpdate = jest.fn();
const mockFind = jest.fn();
const mockCountDocuments = jest.fn();
const mockSort = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();
const mockToArray = jest.fn();
const mockProject = jest.fn();

const mockReviewsFind = jest.fn();
const mockReviewsToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  usersCol: jest.fn(() => ({
    findOneAndUpdate: mockFindOneAndUpdate,
    countDocuments: mockCountDocuments,
    find: mockFind,
  })),
  reviewsCol: jest.fn(() => ({
    find: mockReviewsFind,
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

import * as userService from "../services/user.service.js";

describe("user.service", () => {
  const mockOid = new ObjectId("507f1f77bcf86cd799439011");

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockProject.mockReturnValue({ toArray: mockToArray });
  });

  describe("getAllUsers", () => {
    it("should return paginated users without filters", async () => {
      const data = [{ _id: mockOid, name: "John", email: "john@test.com" }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply search filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await userService.getAllUsers({ page: 1, limit: 10, search: "john" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply role filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await userService.getAllUsers({ page: 1, limit: 10, role: "doctor" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ role: "doctor" }]) })
      );
    });
  });

  describe("updateUser", () => {
    it("should update and return the user", async () => {
      const updated = { _id: mockOid, name: "Updated Name" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await userService.updateUser("507f1f77bcf86cd799439011", { name: "Updated Name" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await userService.updateUser("507f1f77bcf86cd799439011", { _id: "remove", name: "Test" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("getPatientsForDoctor", () => {
    it("should return empty array when no reviews", async () => {
      mockReviewsFind.mockReturnValue({ toArray: mockReviewsToArray });
      mockReviewsToArray.mockResolvedValue([]);

      const result = await userService.getPatientsForDoctor("doc123");

      expect(result).toEqual([]);
    });
  });
});
