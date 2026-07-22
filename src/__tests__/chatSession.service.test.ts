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
const mockUsersFind = jest.fn();
const mockUsersToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  chatSessionsCol: jest.fn(() => ({
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
}));

import * as chatSessionService from "../services/chatSession.service.js";

describe("chatSession.service", () => {
  const mockOid = new ObjectId("507f1f77bcf86cd799439011");
  const mockUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockUsersFind.mockReturnValue({ toArray: mockUsersToArray });
    mockUsersToArray.mockResolvedValue([]);
  });

  describe("getAllSessions", () => {
    it("should return paginated sessions for user", async () => {
      const data = [{ _id: new ObjectId(), participants: [mockOid] }];
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue(data);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await chatSessionService.getAllSessions(mockUserId, { page: 1, limit: 10 });

      expect(result.data[0]._id).toEqual(data[0]._id);
      expect(result.data[0].participantUsers).toBeDefined();
      expect(result.pagination.page).toBe(1);
    });

    it("should filter by status", async () => {
      mockCountDocuments.mockResolvedValue(0);
      mockToArray.mockResolvedValue([]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      await chatSessionService.getAllSessions(mockUserId, { page: 1, limit: 10, status: "Active" });

      expect(mockCountDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ participants: expect.any(ObjectId), status: "Active" })
      );
    });
  });

  describe("getSessionById", () => {
    it("should find by ID", async () => {
      const session = { _id: new ObjectId(), participants: [mockOid], messages: [] };
      mockFindOne.mockResolvedValue(session);

      const result = await chatSessionService.getSessionById("507f1f77bcf86cd799439011");

      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const result = await chatSessionService.getSessionById("507f1f77bcf86cd799439011");

      expect(result).toBeNull();
    });
  });

  describe("createSession", () => {
    it("should create a new session", async () => {
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await chatSessionService.createSession({ participants: [mockUserId], sessionTitle: "Test" });

      expect(result._id).toEqual(insertedId);
      expect(result.status).toBe("Active");
    });
  });

  describe("addMessage", () => {
    it("should add message and return session", async () => {
      mockUpdateOne.mockResolvedValue({});
      const session = { _id: new ObjectId(), participants: [mockOid], messages: [] };
      mockFindOne.mockResolvedValue(session);

      const result = await chatSessionService.addMessage("507f1f77bcf86cd799439011", mockUserId, "Hello");

      expect(mockUpdateOne).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe("updateSessionStatus", () => {
    it("should update status", async () => {
      const updated = { _id: new ObjectId(), status: "Archived" };
      mockFindOneAndUpdate.mockResolvedValue(updated);

      const result = await chatSessionService.updateSessionStatus("507f1f77bcf86cd799439011", "Archived");

      expect(result).toEqual(updated);
    });
  });

  describe("deleteSession", () => {
    it("should delete and return the session", async () => {
      const deleted = { _id: new ObjectId() };
      mockFindOneAndDelete.mockResolvedValue(deleted);

      const result = await chatSessionService.deleteSession("507f1f77bcf86cd799439011");

      expect(result).toEqual(deleted);
    });
  });

  describe("isParticipant", () => {
    it("should return true when user is participant", () => {
      const session = { participants: [mockOid] } as any;

      const result = chatSessionService.isParticipant(session, mockUserId);

      expect(result).toBe(true);
    });

    it("should return false when user is not participant", () => {
      const otherOid = new ObjectId();
      const session = { participants: [otherOid] } as any;

      const result = chatSessionService.isParticipant(session, mockUserId);

      expect(result).toBe(false);
    });
  });
});
