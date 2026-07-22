import { ObjectId } from "mongodb";

const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();

jest.mock("../db/collections.js", () => ({
  healthRecordsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
  })),
  toObjectId: jest.fn((id: string) => new ObjectId(id)),
}));

import * as healthRecordService from "../services/healthRecord.service.js";

describe("healthRecord.service", () => {
  const mockPatientId = "507f1f77bcf86cd799439011";
  const mockOid = new ObjectId(mockPatientId);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHealthRecordByPatientId", () => {
    it("should find record by patient ID", async () => {
      const record = { _id: new ObjectId(), patientId: mockOid };
      mockFindOne.mockResolvedValue(record);

      const result = await healthRecordService.getHealthRecordByPatientId(mockPatientId);

      expect(mockFindOne).toHaveBeenCalledWith({ patientId: expect.any(ObjectId) });
      expect(result).toEqual(record);
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await healthRecordService.getHealthRecordByPatientId(mockPatientId);

      expect(result).toBeNull();
    });
  });

  describe("createHealthRecord", () => {
    it("should create a new record", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = {
        patientId: mockPatientId,
        chronicConditions: ["Asthma"],
        allergies: ["Penicillin"],
      };
      const result = await healthRecordService.createHealthRecord(data);

      expect(mockInsertOne).toHaveBeenCalled();
      expect(result._id).toEqual(insertedId);
      expect(result.chronicConditions).toEqual(["Asthma"]);
      expect(result.allergies).toEqual(["Penicillin"]);
    });

    it("should use defaults for optional fields", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { patientId: mockPatientId };
      const result = await healthRecordService.createHealthRecord(data);

      expect(result.chronicConditions).toEqual([]);
      expect(result.allergies).toEqual([]);
      expect(result.currentMedications).toEqual([]);
    });
  });

  describe("updateHealthRecord", () => {
    it("should update and return the record", async () => {
      const updated = { _id: new ObjectId(), patientId: mockOid, chronicConditions: ["Diabetes"] };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await healthRecordService.updateHealthRecord(mockPatientId, {
        chronicConditions: ["Diabetes"],
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await healthRecordService.updateHealthRecord(mockPatientId, {
        _id: "should-be-removed",
        chronicConditions: ["Diabetes"],
      });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      const setObj = updateCall.$set as Record<string, unknown>;
      expect(setObj._id).toBeUndefined();
    });
  });

  describe("deleteHealthRecord", () => {
    it("should delete and return the record", async () => {
      const deleted = { _id: new ObjectId(), patientId: mockOid };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await healthRecordService.deleteHealthRecord(mockPatientId);

      expect(mockFindOneAndDelete).toHaveBeenCalledWith({ patientId: expect.any(ObjectId) });
      expect(result).toEqual(deleted);
    });
  });
});
