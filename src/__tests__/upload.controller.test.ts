import { Request, Response } from "express";

jest.mock("../services/upload.service.js", () => ({
  uploadToImageBB: jest.fn(),
}));

import * as uploadService from "../services/upload.service.js";
import * as uploadController from "../controllers/upload.controller.js";

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

describe("Upload Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      (uploadService.uploadToImageBB as jest.Mock).mockResolvedValue("https://img.url");

      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
      } as unknown as Request;
      const res = mockRes();

      await uploadController.uploadImage(req, res as Response);

      expect(uploadService.uploadToImageBB).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test.jpg"
      );
      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Image uploaded successfully",
        data: { url: "https://img.url" },
      });
    });

    it("should return 400 when no file provided", async () => {
      const req = { file: null } as unknown as Request;
      const res = mockRes();

      await uploadController.uploadImage(req, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Image file is required",
      });
    });

    it("should handle errors", async () => {
      (uploadService.uploadToImageBB as jest.Mock).mockRejectedValue(new Error("Upload failed"));

      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
      } as unknown as Request;
      const res = mockRes();

      await uploadController.uploadImage(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Upload failed",
      });
    });

    it("should return generic error for non-Error throws", async () => {
      (uploadService.uploadToImageBB as jest.Mock).mockRejectedValue("string error");

      const req = {
        file: { buffer: Buffer.from("test"), originalname: "test.jpg" },
      } as unknown as Request;
      const res = mockRes();

      await uploadController.uploadImage(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Failed to upload image",
      });
    });
  });
});
