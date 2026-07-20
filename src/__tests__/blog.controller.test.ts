import { Request, Response } from "express";

jest.mock("../services/blog.service.js", () => ({
  getAllBlogs: jest.fn(),
  getBlogById: jest.fn(),
  getBlogByIdInternal: jest.fn(),
  createBlog: jest.fn(),
  updateBlog: jest.fn(),
  deleteBlog: jest.fn(),
}));

jest.mock("../services/upload.service.js", () => ({
  uploadToImageBB: jest.fn().mockResolvedValue("https://example.com/cover.jpg"),
}));

import * as blogService from "../services/blog.service.js";
import * as blogController from "../controllers/blog.controller.js";

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

describe("Blog Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllBlogs", () => {
    it("should return paginated blogs", async () => {
      const mockResult = {
        blogs: [{ _id: "1", title: "Test Blog" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (blogService.getAllBlogs as jest.Mock).mockResolvedValue(mockResult);

      const req = { query: {} } as unknown as Request;
      const res = mockRes();

      await blogController.getAllBlogs(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockResult,
      });
    });
  });

  describe("getBlogById", () => {
    it("should return blog when found", async () => {
      const mockBlog = { _id: "123", title: "Test Blog" };
      (blogService.getBlogById as jest.Mock).mockResolvedValue(mockBlog);

      const req = { params: { id: "123" } } as unknown as Request;
      const res = mockRes();

      await blogController.getBlogById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockBlog,
      });
    });

    it("should return 404 when not found", async () => {
      (blogService.getBlogById as jest.Mock).mockResolvedValue(null);

      const req = { params: { id: "nonexistent" } } as unknown as Request;
      const res = mockRes();

      await blogController.getBlogById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createBlog", () => {
    it("should create blog when authenticated", async () => {
      const mockBlog = { _id: "123", title: "New Blog" };
      (blogService.createBlog as jest.Mock).mockResolvedValue(mockBlog);

      const req = {
        body: { title: "New Blog", content: "Content", excerpt: "Excerpt" },
        user: { userId: "user123", role: "doctor" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await blogController.createBlog(req, res as Response);

      expect(res.statusCode).toBe(201);
    });

    it("should return 401 when not authenticated", async () => {
      const req = {
        body: { title: "New Blog" },
        user: undefined,
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await blogController.createBlog(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("updateBlog", () => {
    it("should update when owner", async () => {
      const existing = { _id: "123", authorId: { toString: () => "user123" } };
      const updated = { _id: "123", title: "Updated" };
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(existing);
      (blogService.updateBlog as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        body: { title: "Updated" },
        user: { userId: "user123", role: "doctor" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await blogController.updateBlog(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Blog updated",
        data: updated,
      });
    });

    it("should return 403 when not owner and not admin", async () => {
      const existing = { _id: "123", authorId: { toString: () => "other-user" } };
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(existing);

      const req = {
        params: { id: "123" },
        body: { title: "Updated" },
        user: { userId: "user123", role: "doctor" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await blogController.updateBlog(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when not found", async () => {
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        body: { title: "Updated" },
        user: { userId: "user123", role: "doctor" },
        file: null,
      } as unknown as Request;
      const res = mockRes();

      await blogController.updateBlog(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("deleteBlog", () => {
    it("should delete when owner", async () => {
      const existing = { _id: "123", authorId: { toString: () => "user123" } };
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(existing);
      (blogService.deleteBlog as jest.Mock).mockResolvedValue(undefined);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await blogController.deleteBlog(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Blog deleted",
        data: null,
      });
    });

    it("should delete when admin", async () => {
      const existing = { _id: "123", authorId: { toString: () => "other-user" } };
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(existing);
      (blogService.deleteBlog as jest.Mock).mockResolvedValue(undefined);

      const req = {
        params: { id: "123" },
        user: { userId: "admin123", role: "admin" },
      } as unknown as Request;
      const res = mockRes();

      await blogController.deleteBlog(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Blog deleted",
        data: null,
      });
    });

    it("should return 403 when not owner and not admin", async () => {
      const existing = { _id: "123", authorId: { toString: () => "other-user" } };
      (blogService.getBlogByIdInternal as jest.Mock).mockResolvedValue(existing);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "doctor" },
      } as unknown as Request;
      const res = mockRes();

      await blogController.deleteBlog(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });
});
