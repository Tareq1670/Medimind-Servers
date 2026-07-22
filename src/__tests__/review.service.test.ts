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
const mockUsersFind = jest.fn();
const mockUsersToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  reviewsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
    aggregate: mockAggregate,
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

import * as reviewService from "../services/review.service.js";

describe("review.service", () => {
  const mockOid = new ObjectId("507f1f77bcf86cd799439011");

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockUsersFind.mockReturnValue({ toArray: mockUsersToArray });
    mockUsersToArray.mockResolvedValue([]);
  });

  describe("getAllReviews", () => {
    it("should return paginated reviews without filters", async () => {
      const data = [{ _id: new ObjectId(), rating: 5, reviewerId: mockOid }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await reviewService.getAllReviews({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply target type filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await reviewService.getAllReviews({ page: 1, limit: 10, targetType: "Medicine" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ targetType: "Medicine" }]) })
      );
    });

    it("should apply rating filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await reviewService.getAllReviews({ page: 1, limit: 10, rating: 5 });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ rating: 5 }]) })
      );
    });

    it("should apply approved filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await reviewService.getAllReviews({ page: 1, limit: 10, approved: "true" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ isApproved: true }]) })
      );
    });
  });

  describe("getReviewById", () => {
    it("should find by ID", async () => {
      const review = { _id: new ObjectId(), rating: 5, reviewerId: mockOid };
      mockFindOne.mockResolvedValue(review);

      const result = await reviewService.getReviewById("507f1f77bcf86cd799439011");

      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await reviewService.getReviewById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createReview", () => {
    it("should create a new review", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { reviewerId: "507f1f77bcf86cd799439011", targetId: "target123", targetType: "Medicine", rating: 4, comment: "Good" };
      const result = await reviewService.createReview(data);

      expect(result._id).toEqual(insertedId);
      expect(result.isApproved).toBe(false);
    });

    it("should default rating to 5", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await reviewService.createReview({ reviewerId: "507f1f77bcf86cd799439011", targetId: "t1", targetType: "Doctor" });

      expect(result.rating).toBe(5);
    });
  });

  describe("updateReview", () => {
    it("should update and return the review", async () => {
      const updated = { _id: new ObjectId(), rating: 4, reviewerId: mockOid };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await reviewService.updateReview("507f1f77bcf86cd799439011", { rating: 4 });

      expect(result).toEqual(updated);
    });
  });

  describe("deleteReview", () => {
    it("should delete and return the review", async () => {
      const deleted = { _id: new ObjectId(), rating: 5 };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await reviewService.deleteReview("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });

  describe("getReviewsByTarget", () => {
    it("should return approved reviews for target", async () => {
      const data = [{ _id: new ObjectId(), rating: 5, reviewerId: mockOid }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await reviewService.getReviewsByTarget("Medicine", "target123", 1, 10);

      expect(result.data).toEqual(data);
    });
  });

  describe("approveReview", () => {
    it("should approve and return the review", async () => {
      const approved = { _id: new ObjectId(), rating: 5, isApproved: true };
      mockFindOneAndUpdate.mockResolvedValue(approved);

      const result = await reviewService.approveReview("507f1f77bcf86cd799439011");

      expect(result).toEqual(approved);
    });
  });

  describe("getAverageRating", () => {
    it("should return average rating", async () => {
      mockAggregate.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ avgRating: 4.5 }]) });

      const result = await reviewService.getAverageRating("target123", "Medicine");

      expect(result).toBe(4.5);
    });

    it("should return 0 when no reviews", async () => {
      mockAggregate.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) });

      const result = await reviewService.getAverageRating("target123", "Medicine");

      expect(result).toBe(0);
    });
  });
});
