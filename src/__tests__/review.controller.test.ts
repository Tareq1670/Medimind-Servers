import { Request, Response } from "express";

jest.mock("../services/review.service.js", () => ({
  getAllReviews: jest.fn(),
  getReviewById: jest.fn(),
  createReview: jest.fn(),
  updateReview: jest.fn(),
  deleteReview: jest.fn(),
  getReviewsByTarget: jest.fn(),
  approveReview: jest.fn(),
}));

import * as reviewService from "../services/review.service.js";
import * as reviewController from "../controllers/review.controller.js";

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

describe("Review Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllReviews", () => {
    it("should return paginated reviews", async () => {
      const mockResult = {
        reviews: [{ _id: "1", rating: 5 }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (reviewService.getAllReviews as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await reviewController.getAllReviews(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });
  });

  describe("getReviewById", () => {
    it("should return review when found", async () => {
      const mockReview = { _id: "123", rating: 5 };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(mockReview);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await reviewController.getReviewById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockReview,
      });
    });

    it("should return 404 when not found", async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await reviewController.getReviewById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createReview", () => {
    it("should create review when authenticated", async () => {
      const mockReview = { _id: "123", rating: 5 };
      (reviewService.createReview as jest.Mock).mockResolvedValue(mockReview);

      const req = {
        body: { targetType: "Medicine", targetId: "target123", rating: 5, comment: "Great" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.createReview(req, res as Response);

      expect(res.statusCode).toBe(201);
    });

    it("should return 401 when not authenticated", async () => {
      const req = {
        body: { targetType: "Medicine", targetId: "target123", rating: 5 },
        user: undefined,
      } as unknown as Request;
      const res = mockRes();

      await reviewController.createReview(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should return 409 on duplicate review", async () => {
      const error = new Error("Duplicate key") as Error & { code: number };
      error.code = 11000;
      (reviewService.createReview as jest.Mock).mockRejectedValue(error);

      const req = {
        body: { targetType: "Medicine", targetId: "target123", rating: 5 },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.createReview(req, res as Response);

      expect(res.statusCode).toBe(409);
      expect(res.jsonData).toEqual({
        success: false,
        message: "You have already reviewed this item",
      });
    });
  });

  describe("updateReview", () => {
    it("should update when owner", async () => {
      const existing = { _id: "123", reviewerId: { toString: () => "user123" } };
      const updated = { _id: "123", rating: 4 };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);
      (reviewService.updateReview as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        body: { rating: 4 },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.updateReview(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Review updated",
        data: updated,
      });
    });

    it("should return 403 when not owner", async () => {
      const existing = { _id: "123", reviewerId: { toString: () => "other-user" } };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);

      const req = {
        params: { id: "123" },
        body: { rating: 4 },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.updateReview(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when review not found", async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        body: { rating: 4 },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.updateReview(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteReview", () => {
    it("should delete when owner", async () => {
      const existing = { _id: "123", reviewerId: { toString: () => "user123" } };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);
      (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.deleteReview(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Review deleted",
        data: null,
      });
    });

    it("should delete when admin", async () => {
      const existing = { _id: "123", reviewerId: { toString: () => "other-user" } };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);
      (reviewService.deleteReview as jest.Mock).mockResolvedValue(undefined);

      const req = {
        params: { id: "123" },
        user: { userId: "admin123", role: "admin" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.deleteReview(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Review deleted",
        data: null,
      });
    });

    it("should return 403 when not owner and not admin", async () => {
      const existing = { _id: "123", reviewerId: { toString: () => "other-user" } };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await reviewController.deleteReview(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("getReviewsByTarget", () => {
    it("should return reviews for valid target type", async () => {
      const mockResult = { reviews: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      (reviewService.getReviewsByTarget as jest.Mock).mockResolvedValue(mockResult);

      const req = { params: { targetType: "Doctor", targetId: "doc123" }, query: {} } as unknown as Request;
      const res = mockRes();

      await reviewController.getReviewsByTarget(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });

    it("should return 400 for invalid target type", async () => {
      const req = { params: { targetType: "Invalid", targetId: "123" }, query: {} } as unknown as Request;
      const res = mockRes();

      await reviewController.getReviewsByTarget(req, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Invalid target type. Must be 'Doctor' or 'Medicine'",
      });
    });
  });

  describe("approveReview", () => {
    it("should approve review when found", async () => {
      const existing = { _id: "123", isApproved: false };
      const approved = { _id: "123", isApproved: true };
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(existing);
      (reviewService.approveReview as jest.Mock).mockResolvedValue(approved);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await reviewController.approveReview(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Review approved",
        data: approved,
      });
    });

    it("should return 404 when not found", async () => {
      (reviewService.getReviewById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await reviewController.approveReview(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });
});
