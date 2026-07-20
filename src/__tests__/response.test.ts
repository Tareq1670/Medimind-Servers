import { Response } from "express";
import { sendSuccess, sendError } from "../utils/response.js";

describe("Response Utilities", () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("sendSuccess", () => {
    it("should return 200 with data by default", () => {
      sendSuccess(mockRes as Response, { id: 1 }, "OK");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: { id: 1 },
      });
    });

    it("should use custom status code", () => {
      sendSuccess(mockRes as Response, null, "Created", 201);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Created",
        data: null,
      });
    });

    it("should default message to 'Success'", () => {
      sendSuccess(mockRes as Response, "test");
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Success",
        data: "test",
      });
    });
  });

  describe("sendError", () => {
    it("should return 500 by default", () => {
      sendError(mockRes as Response, "Something went wrong");
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });
    });

    it("should use custom status code", () => {
      sendError(mockRes as Response, "Not found", 404);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });

    it("should default message to 'Internal Server Error'", () => {
      sendError(mockRes as Response);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal Server Error",
      });
    });
  });
});
