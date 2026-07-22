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
const mockUpdateOne = jest.fn();
const mockUsersToArray = jest.fn();
const mockUsersFind = jest.fn();

jest.mock("../db/collections.js", () => ({
  blogsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
    updateOne: mockUpdateOne,
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

import * as blogService from "../services/blog.service.js";

describe("blog.service", () => {
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

  describe("getAllBlogs", () => {
    it("should return paginated blogs", async () => {
      const data = [{ _id: new ObjectId(), title: "Health Tips", authorId: mockOid }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await blogService.getAllBlogs({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply search filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await blogService.getAllBlogs({ page: 1, limit: 10, search: "health" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply tag filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await blogService.getAllBlogs({ page: 1, limit: 10, tag: "wellness" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ tags: "wellness" }]) })
      );
    });

    it("should apply status filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await blogService.getAllBlogs({ page: 1, limit: 10, status: "Published" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ status: "Published" }]) })
      );
    });
  });

  describe("getBlogByIdInternal", () => {
    it("should find by ID without view count increment", async () => {
      const blog = { _id: new ObjectId(), title: "Test" };
      mockFindOne.mockResolvedValue(blog);

      const result = await blogService.getBlogByIdInternal("507f1f77bcf86cd799439011");

      expect(mockUpdateOne).not.toHaveBeenCalled();
      expect(result).toEqual(blog);
    });
  });

  describe("getBlogById", () => {
    it("should increment view count and return blog", async () => {
      const blog = { _id: new ObjectId(), title: "Test", authorId: mockOid };
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue(blog);

      const result = await blogService.getBlogById("507f1f77bcf86cd799439011");

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        { $inc: { viewCount: 1 } }
      );
      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue(null);

      const result = await blogService.getBlogById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("getBlogBySlug", () => {
    it("should find by slug", async () => {
      const blog = { _id: new ObjectId(), slug: "health-tips", authorId: mockOid };
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue(blog);

      const result = await blogService.getBlogBySlug("health-tips");

      expect(result).toBeDefined();
    });
  });

  describe("createBlog", () => {
    it("should create a new blog", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { title: "New Blog", content: "Content here", authorId: "507f1f77bcf86cd799439011", tags: ["health"], status: "Draft" };
      const result = await blogService.createBlog(data);

      expect(result._id).toEqual(insertedId);
      expect(result.title).toBe("New Blog");
      expect(result.slug).toBe("new-blog");
    });

    it("should generate slug from title", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await blogService.createBlog({ title: "Health & Wellness Tips!", content: "Content", authorId: "507f1f77bcf86cd799439011" });

      expect(result.slug).toBe("health-wellness-tips");
      expect(result.status).toBe("Draft");
      expect(result.viewCount).toBe(0);
    });
  });

  describe("updateBlog", () => {
    it("should update and return the blog", async () => {
      const updated = { _id: new ObjectId(), title: "Updated", authorId: mockOid };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await blogService.updateBlog("507f1f77bcf86cd799439011", { title: "Updated" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await blogService.updateBlog("507f1f77bcf86cd799439011", { _id: "remove", title: "Test" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("deleteBlog", () => {
    it("should delete and return the blog", async () => {
      const deleted = { _id: new ObjectId(), title: "To Delete" };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await blogService.deleteBlog("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });
});
