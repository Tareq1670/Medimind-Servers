import request from "supertest";
import { ObjectId } from "mongodb";

const mockCommand = jest.fn();
const mockCollection = jest.fn();
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockSkip = jest.fn();
const mockLimit = jest.fn();
const mockToArray = jest.fn();
const mockFindOne = jest.fn();
const mockCountDocuments = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockFindOneAndDelete = jest.fn();
const mockAggregate = jest.fn();
const mockDistinct = jest.fn();
const mockUpdateOne = jest.fn();

jest.mock("../config/db.js", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  getDB: jest.fn(() => ({
    collection: mockCollection,
    command: mockCommand,
  })),
}));

jest.mock("../db/collections.js", () => ({
  usersCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    countDocuments: mockCountDocuments,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    updateOne: mockUpdateOne,
    aggregate: mockAggregate,
    distinct: mockDistinct,
  })),
  doctorsCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    countDocuments: mockCountDocuments,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
  })),
  medicinesCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    countDocuments: mockCountDocuments,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    aggregate: mockAggregate,
  })),
  blogsCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    countDocuments: mockCountDocuments,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    updateOne: mockUpdateOne,
  })),
  reviewsCol: jest.fn(() => ({
    find: jest.fn(() => ({
      sort: jest.fn(() => ({ limit: jest.fn(() => ({ toArray: mockToArray })) })),
      toArray: mockToArray,
    })),
    countDocuments: mockCountDocuments,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    distinct: mockDistinct,
    aggregate: mockAggregate,
  })),
  chatSessionsCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    countDocuments: mockCountDocuments,
    aggregate: mockAggregate,
  })),
  reportAnalysesCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    countDocuments: mockCountDocuments,
    deleteOne: jest.fn(),
  })),
  symptomAnalysesCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    countDocuments: mockCountDocuments,
  })),
  healthRecordsCol: jest.fn(() => ({
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    findOneAndUpdate: mockFindOneAndUpdate,
    findOneAndDelete: mockFindOneAndDelete,
    countDocuments: mockCountDocuments,
  })),
  toObjectId: jest.fn((id: string) => new ObjectId(id)),
}));

jest.mock("../config/env.js", () => ({
  env: {
    nodeEnv: "test",
    frontendUrl: "http://localhost:3000",
    allowedOrigins: ["http://localhost:3000"],
    geminiApiKey: "test-key",
    groqApiKey: "test-groq-key",
    imagebbApiKey: "test-imgbb-key",
    jwtSecret: "test-secret",
  },
}));

jest.mock("helmet", () => jest.fn(() => (_req: any, _res: any, next: () => void) => next()));
jest.mock("morgan", () => jest.fn(() => (_req: any, _res: any, next: () => void) => next()));

import app from "../app.js";

describe("Integration Tests", () => {
  function setupMockChain() {
    const sortResult = { skip: mockSkip, toArray: mockToArray };
    const skipResult = { limit: mockLimit, toArray: mockToArray };
    const limitResult = { toArray: mockToArray };
    const findResult = { sort: mockSort, toArray: mockToArray };
    mockFind.mockReturnValue(findResult);
    mockSort.mockReturnValue(sortResult);
    mockSkip.mockReturnValue(skipResult);
    mockLimit.mockReturnValue(limitResult);
    mockToArray.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);
  }

  beforeAll(() => {
    mockCommand.mockResolvedValue({ ok: 1 });
    setupMockChain();
    mockCollection.mockReturnValue({
      find: mockFind,
      findOne: mockFindOne,
      insertOne: mockInsertOne,
      countDocuments: mockCountDocuments,
      updateOne: mockUpdateOne,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCommand.mockResolvedValue({ ok: 1 });
    setupMockChain();
  });

  describe("Public API Endpoints", () => {
    it("GET / should return API info", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.version).toBe("1.0.0");
    });

    it("GET /api/v1/health should return healthy status", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("GET /health should redirect to /api/v1/health", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(302);
    });

    it("GET /favicon.ico should return 204", async () => {
      const res = await request(app).get("/favicon.ico");
      expect(res.status).toBe(204);
    });

    it("GET /unknown-route should return 404", async () => {
      const res = await request(app).get("/unknown-route");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("GET /api/v1/medicines should return paginated medicines", async () => {
      mockToArray.mockResolvedValue([{ _id: new ObjectId(), name: "Paracetamol" }]);
      mockCountDocuments.mockResolvedValue(1);

      const res = await request(app).get("/api/v1/medicines");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });

    it("GET /api/v1/doctors should return paginated doctors", async () => {
      const oid = new ObjectId();
      mockToArray.mockResolvedValue([{ _id: oid, specialty: "Cardiology", userId: oid }]);
      mockCountDocuments.mockResolvedValue(1);

      const res = await request(app).get("/api/v1/doctors");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
    });

    it("GET /api/v1/blogs should return paginated blogs", async () => {
      const oid = new ObjectId();
      mockToArray.mockResolvedValue([{ _id: oid, title: "Test", authorId: oid }]);
      mockCountDocuments.mockResolvedValue(1);

      const res = await request(app).get("/api/v1/blogs");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
