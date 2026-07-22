import { paginate, andFilter, regexSearch } from "../utils/pagination.js";

describe("Pagination Utility", () => {
  describe("paginate", () => {
    it("should return correct pagination for first page", async () => {
      const result = await paginate(50, { page: 1, limit: 10 });
      expect(result).toEqual({
        pagination: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: false,
        },
      });
    });

    it("should return correct pagination for middle page", async () => {
      const result = await paginate(50, { page: 3, limit: 10 });
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it("should return correct pagination for last page", async () => {
      const result = await paginate(50, { page: 5, limit: 10 });
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it("should handle zero total items", async () => {
      const result = await paginate(0, { page: 1, limit: 10 });
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
    });

    it("should handle single item", async () => {
      const result = await paginate(1, { page: 1, limit: 10 });
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it("should handle limit larger than total", async () => {
      const result = await paginate(3, { page: 1, limit: 10 });
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });

  describe("andFilter", () => {
    it("should return empty object for empty conditions", () => {
      expect(andFilter([])).toEqual({});
    });

    it("should return the single condition for one element", () => {
      const cond = { category: "Painkillers" };
      expect(andFilter([cond])).toEqual(cond);
    });

    it("should combine multiple conditions with $and", () => {
      const result = andFilter([{ category: "Painkillers" }, { price: { $gte: 10 } }]);
      expect(result).toEqual({
        $and: [{ category: "Painkillers" }, { price: { $gte: 10 } }],
      });
    });
  });

  describe("regexSearch", () => {
    it("should create regex search for single field", () => {
      const result = regexSearch(["name"], "aspirin");
      expect(result).toEqual({
        $or: [{ name: { $regex: "aspirin", $options: "i" } }],
      });
    });

    it("should create regex search for multiple fields", () => {
      const result = regexSearch(["name", "genericName"], "test");
      expect(result).toEqual({
        $or: [
          { name: { $regex: "test", $options: "i" } },
          { genericName: { $regex: "test", $options: "i" } },
        ],
      });
    });
  });
});
