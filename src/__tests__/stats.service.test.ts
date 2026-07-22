import { ObjectId } from "mongodb";

const mockCountDocuments = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockLimit = jest.fn();
const mockToArray = jest.fn();
const mockDistinct = jest.fn();
const mockAggregate = jest.fn();
const mockCommand = jest.fn();
const mockGetDB = jest.fn();

jest.mock("../db/collections.js", () => ({
  usersCol: jest.fn(() => ({ countDocuments: mockCountDocuments, find: mockFind })),
  medicinesCol: jest.fn(() => ({ countDocuments: mockCountDocuments })),
  doctorsCol: jest.fn(() => ({ countDocuments: mockCountDocuments, findOne: mockFindOne, find: mockFind })),
  reviewsCol: jest.fn(() => ({
    countDocuments: mockCountDocuments,
    find: jest.fn(() => {
      const chain: any = { toArray: mockToArray };
      chain.sort = jest.fn(() => chain);
      chain.limit = jest.fn(() => chain);
      return chain;
    }),
    distinct: mockDistinct,
    aggregate: mockAggregate,
  })),
  blogsCol: jest.fn(() => ({ countDocuments: mockCountDocuments })),
  chatSessionsCol: jest.fn(() => ({})),
  reportAnalysesCol: jest.fn(() => ({})),
  symptomAnalysesCol: jest.fn(() => ({ countDocuments: mockCountDocuments })),
  healthRecordsCol: jest.fn(() => ({ findOne: mockFindOne })),
  toObjectId: jest.fn((id: string) => new ObjectId(id)),
}));

jest.mock("../config/db.js", () => ({
  getDB: mockGetDB,
}));

jest.mock("../config/env.js", () => ({
  env: { geminiApiKey: "test-key", groqApiKey: "test-groq-key" },
}));

describe("stats.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockCommand.mockResolvedValue({ ok: 1 });
    mockGetDB.mockReturnValue({ command: mockCommand });
    mockToArray.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);
  });

  describe("getDashboardStats", () => {
    it("should return admin dashboard stats", async () => {
      mockCountDocuments.mockResolvedValue(0);

      const { getDashboardStats } = await import("../services/stats.service.js");
      const result = await getDashboardStats();

      expect(result.admin).toBeDefined();
      expect(result.admin.totalUsers).toBe(0);
      expect(result.admin.systemHealth).toBeDefined();
      expect(result.admin.systemHealth.mongodb).toBe(true);
      expect(result.admin.systemHealth.ai).toBe(true);
    });

    it("should report system health issues", async () => {
      mockCommand.mockRejectedValue(new Error("Connection failed"));

      const envModule = require("../config/env.js");
      envModule.env.geminiApiKey = "";
      envModule.env.groqApiKey = "";

      const { getDashboardStats } = await import("../services/stats.service.js");
      const result = await getDashboardStats();

      expect(result.admin.systemHealth.mongodb).toBe(false);
      expect(result.admin.systemHealth.api).toBe(false);
      expect(result.admin.systemHealth.ai).toBe(false);
    });

    it("should generate monthly trends for 12 months", async () => {
      mockCountDocuments.mockResolvedValue(5);

      const { getDashboardStats } = await import("../services/stats.service.js");
      const result = await getDashboardStats();

      expect(result.admin.userGrowth).toHaveLength(12);
      expect(result.admin.contentGrowth).toHaveLength(12);
      expect(result.admin.aiUsage).toHaveLength(12);
      expect(result.admin.userGrowth[0].count).toBe(5);
    });
  });

  describe("getUserDashboardStats", () => {
    it("should return user dashboard stats", async () => {
      mockFindOne.mockResolvedValue(null);
      mockToArray.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const { getUserDashboardStats } = await import("../services/stats.service.js");
      const result = await getUserDashboardStats("507f1f77bcf86cd799439011");

      expect(result.user).toBeDefined();
      expect(result.user.healthScore).toBe(70);
      expect(result.user.recordCount).toBe(0);
      expect(result.user.recentActivity).toEqual([]);
    });

    it("should compute health score from record", async () => {
      mockFindOne.mockResolvedValue({ _id: new ObjectId(), patientId: "user1" });
      mockToArray.mockResolvedValue([]);
      mockCountDocuments.mockResolvedValue(0);

      const { getUserDashboardStats } = await import("../services/stats.service.js");
      const result = await getUserDashboardStats("user1");

      expect(result.user.healthScore).toBe(85);
      expect(result.user.recordCount).toBe(1);
      expect(result.user.vitalsTrend).toHaveLength(7);
    });
  });

  describe("getDoctorDashboardStats", () => {
    it("should return empty stats when doctor not found", async () => {
      mockFindOne.mockResolvedValue(null);

      const { getDoctorDashboardStats } = await import("../services/stats.service.js");
      const result = await getDoctorDashboardStats("507f1f77bcf86cd799439011");

      expect(result.doctor).toBeDefined();
      expect(result.doctor.patientCount).toBe(0);
    });

    it("should return doctor dashboard stats", async () => {
      const doctorId = new ObjectId();
      mockFindOne.mockResolvedValue({
        _id: doctorId,
        userId: new ObjectId(),
        consultationFee: 100,
      });
      mockToArray.mockResolvedValue([
        { _id: "r1", reviewerId: "p1", rating: 5 },
        { _id: "r2", reviewerId: "p2", rating: 4 },
      ]);
      mockDistinct.mockResolvedValue(["p1", "p2"]);
      mockCountDocuments.mockResolvedValue(2);
      mockAggregate.mockReturnValue({ toArray: jest.fn().mockResolvedValue([{ avg: 4.5 }]) });

      const { getDoctorDashboardStats } = await import("../services/stats.service.js");
      const result = await getDoctorDashboardStats("507f1f77bcf86cd799439011");

      expect(result.doctor.patientCount).toBe(2);
      expect(result.doctor.reviewCount).toBe(2);
      expect(result.doctor.earnings).toBe(200);
    });
  });
});
