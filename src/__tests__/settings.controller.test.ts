import { Request, Response } from "express";

jest.mock("../services/settings.service.js", () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));

import * as settingsService from "../services/settings.service.js";
import * as settingsController from "../controllers/settings.controller.js";

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

describe("Settings Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return settings", async () => {
      const mockSettings = {
        maintenance_mode: false,
        allow_registration: true,
        require_doctor_verification: true,
        ai_disclaimer: true,
      };
      (settingsService.getSettings as jest.Mock).mockResolvedValue(mockSettings);

      const req = {} as unknown as Request;
      const res = mockRes();

      await settingsController.getSettings(req, res as Response);

      expect(settingsService.getSettings).toHaveBeenCalled();
      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: mockSettings,
      });
    });

    it("should handle errors", async () => {
      (settingsService.getSettings as jest.Mock).mockRejectedValue(new Error("Fetch error"));

      const req = {} as unknown as Request;
      const res = mockRes();

      await settingsController.getSettings(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Fetch error",
      });
    });

    it("should return generic error for non-Error throws", async () => {
      (settingsService.getSettings as jest.Mock).mockRejectedValue("unknown");

      const req = {} as unknown as Request;
      const res = mockRes();

      await settingsController.getSettings(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Failed to fetch settings",
      });
    });
  });

  describe("updateSettings", () => {
    it("should update and return settings", async () => {
      const mockUpdated = {
        maintenance_mode: true,
        allow_registration: false,
        require_doctor_verification: true,
        ai_disclaimer: true,
      };
      (settingsService.updateSettings as jest.Mock).mockResolvedValue(mockUpdated);

      const req = {
        body: { maintenance_mode: true, allow_registration: false },
      } as unknown as Request;
      const res = mockRes();

      await settingsController.updateSettings(req, res as Response);

      expect(settingsService.updateSettings).toHaveBeenCalledWith({
        maintenance_mode: true,
        allow_registration: false,
      });
      expect(res.jsonData).toEqual({
        success: true,
        message: "Settings updated",
        data: mockUpdated,
      });
    });

    it("should handle errors", async () => {
      (settingsService.updateSettings as jest.Mock).mockRejectedValue(new Error("Update error"));

      const req = { body: { maintenance_mode: true } } as unknown as Request;
      const res = mockRes();

      await settingsController.updateSettings(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Update error",
      });
    });
  });
});
