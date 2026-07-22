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

const mockUsersFind = jest.fn();
const mockUsersSort = jest.fn();
const mockUsersSkip = jest.fn();
const mockUsersLimit = jest.fn();
const mockUsersToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  doctorsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
    find: mockFind,
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

import * as doctorService from "../services/doctor.service.js";

describe("doctor.service", () => {
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

  describe("getAllDoctors", () => {
    it("should return paginated doctors", async () => {
      const data = [{ _id: new ObjectId(), specialty: "Cardiology", userId: mockOid }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await doctorService.getAllDoctors({ page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
    });

    it("should apply search filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await doctorService.getAllDoctors({ page: 1, limit: 10, search: "cardio" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });

    it("should apply specialty filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await doctorService.getAllDoctors({ page: 1, limit: 10, specialty: "Cardiology" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ specialty: "Cardiology" }]) })
      );
    });

    it("should apply verified filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await doctorService.getAllDoctors({ page: 1, limit: 10, verified: "true" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.arrayContaining([{ isVerified: true }]) })
      );
    });

    it("should apply consultation fee range filter", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await doctorService.getAllDoctors({ page: 1, limit: 10, minFee: 50, maxFee: 200 });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ $and: expect.any(Array) })
      );
    });
  });

  describe("getDoctorById", () => {
    it("should find by ID", async () => {
      const doctor = { _id: new ObjectId(), specialty: "Cardiology", userId: mockOid };
      mockFindOne.mockResolvedValue(doctor);

      const result = await doctorService.getDoctorById("507f1f77bcf86cd799439011");

      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await doctorService.getDoctorById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("getDoctorByUserId", () => {
    it("should find by user ID", async () => {
      const doctor = { _id: new ObjectId(), specialty: "Cardiology", userId: mockOid };
      mockFindOne.mockResolvedValue(doctor);

      const result = await doctorService.getDoctorByUserId("507f1f77bcf86cd799439011");

      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await doctorService.getDoctorByUserId("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createDoctor", () => {
    it("should create a new doctor", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const data = { userId: "507f1f77bcf86cd799439011", specialty: "Cardiology", experienceYears: 10, hospitalAffiliation: "City Hospital", bio: "Expert", consultationFee: 150, isVerified: true, availabilitySlots: [] };
      const result = await doctorService.createDoctor(data);

      expect(result._id).toEqual(insertedId);
      expect(result.specialty).toBe("Cardiology");
    });

    it("should use defaults for missing fields", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await doctorService.createDoctor({ userId: "507f1f77bcf86cd799439011" });

      expect(result.experienceYears).toBe(0);
      expect(result.consultationFee).toBe(0);
      expect(result.isVerified).toBe(false);
    });
  });

  describe("updateDoctor", () => {
    it("should update and return the doctor", async () => {
      const updated = { _id: new ObjectId(), specialty: "Neurology", userId: mockOid };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await doctorService.updateDoctor("507f1f77bcf86cd799439011", { specialty: "Neurology" });

      expect(result).toEqual(updated);
    });

    it("should strip _id from update", async () => {
      mockFindOneAndUpdate.mockResolvedValue(null);

      await doctorService.updateDoctor("507f1f77bcf86cd799439011", { _id: "remove" });

      const updateCall = mockFindOneAndUpdate.mock.calls[0][1];
      expect((updateCall.$set as Record<string, unknown>)._id).toBeUndefined();
    });
  });

  describe("deleteDoctor", () => {
    it("should delete and return the doctor", async () => {
      const deleted = { _id: new ObjectId(), specialty: "Cardiology" };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await doctorService.deleteDoctor("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });
});
