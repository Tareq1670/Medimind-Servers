const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("../config/env.js", () => ({
  env: { imagebbApiKey: "test-api-key" },
}));

import * as uploadService from "../services/upload.service.js";

describe("upload.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("uploadToImageBB", () => {
    it("should upload and return image URL", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: { url: "https://img.url/image.jpg" } }),
      });

      const result = await uploadService.uploadToImageBB(Buffer.from("test"), "test.jpg");

      expect(result).toBe("https://img.url/image.jpg");
      expect(mockFetch).toHaveBeenCalled();
    });

    it("should throw when upload fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue("Bad request"),
      });

      await expect(uploadService.uploadToImageBB(Buffer.from("test"), "test.jpg")).rejects.toThrow("ImageBB upload failed (400)");
    });

    it("should throw when API key is missing", async () => {
      const envModule = require("../config/env.js");
      envModule.env.imagebbApiKey = "";

      await expect(uploadService.uploadToImageBB(Buffer.from("test"))).rejects.toThrow("IMAGEBB_API_KEY environment variable is not set");
    });
  });
});
