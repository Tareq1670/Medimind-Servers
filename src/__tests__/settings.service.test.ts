import { ObjectId } from "mongodb";

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockCollection = jest.fn();
const mockDb = jest.fn();

jest.mock("../config/db.js", () => ({
  getDB: jest.fn(() => ({
    collection: mockCollection,
  })),
}));

import * as settingsService from "../services/settings.service.js";

describe("settings.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue({
      findOne: mockFindOne,
      updateOne: mockUpdateOne,
    });
  });

  describe("getSettings", () => {
    it("should return settings from DB", async () => {
      const dbSettings = { maintenance_mode: true, allow_registration: false };
      mockFindOne.mockResolvedValue({ _id: "global", ...dbSettings });

      const result = await settingsService.getSettings();

      expect(result.maintenance_mode).toBe(true);
      expect(result.allow_registration).toBe(false);
      expect(result.require_doctor_verification).toBe(true);
    });

    it("should return defaults when no document found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await settingsService.getSettings();

      expect(result.maintenance_mode).toBe(false);
      expect(result.allow_registration).toBe(true);
    });
  });

  describe("updateSettings", () => {
    it("should update and return merged settings", async () => {
      mockUpdateOne.mockResolvedValue({});
      const dbSettings = { maintenance_mode: true, allow_registration: false, require_doctor_verification: true, ai_disclaimer: true };
      mockFindOne.mockResolvedValue({ _id: "global", ...dbSettings });

      const result = await settingsService.updateSettings({ maintenance_mode: true });

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { _id: "global" as any },
        { $set: { maintenance_mode: true } },
        { upsert: true }
      );
      expect(result.maintenance_mode).toBe(true);
    });
  });
});
