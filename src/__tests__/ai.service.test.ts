import { ObjectId } from "mongodb";

const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockSort = jest.fn();
const mockLimit = jest.fn();
const mockSkip = jest.fn();
const mockToArray = jest.fn();
const mockCountDocuments = jest.fn();
const mockUpdateOne = jest.fn();

const mockHrFind = jest.fn();
const mockHrSort = jest.fn();
const mockHrLimit = jest.fn();
const mockHrToArray = jest.fn();

jest.mock("../db/collections.js", () => ({
  symptomAnalysesCol: jest.fn(() => ({
    insertOne: mockInsertOne,
    find: mockFind,
    countDocuments: mockCountDocuments,
  })),
  reportAnalysesCol: jest.fn(() => ({
    insertOne: mockInsertOne,
    find: mockFind,
    countDocuments: mockCountDocuments,
  })),
  chatSessionsCol: jest.fn(() => ({
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    updateOne: mockUpdateOne,
  })),
  healthRecordsCol: jest.fn(() => ({
    find: mockHrFind,
  })),
  toObjectId: jest.fn((id: string) => new ObjectId(id)),
}));

const mockGenerateWithPro = jest.fn();
const mockGenerateWithFlash = jest.fn();
const mockStreamChat = jest.fn();
const mockAnalyzeImageWithVision = jest.fn();

jest.mock("../services/gemini.service.js", () => ({
  generateWithPro: mockGenerateWithPro,
  generateWithFlash: mockGenerateWithFlash,
  streamChat: mockStreamChat,
  analyzeImageWithVision: mockAnalyzeImageWithVision,
}));

const mockAnalyzeWithGroq = jest.fn();

jest.mock("../services/groq.service.js", () => ({
  analyzeWithGroq: mockAnalyzeWithGroq,
}));

jest.mock("../utils/pagination.js", () => ({
  paginate: jest.fn(),
}));

import * as aiService from "../services/ai.service.js";

describe("ai.service", () => {
  const mockUserId = "507f1f77bcf86cd799439011";
  const mockOid = new ObjectId(mockUserId);

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReturnValue({ sort: mockSort });
    mockSort.mockReturnValue({ skip: mockSkip });
    mockSkip.mockReturnValue({ limit: mockLimit });
    mockLimit.mockReturnValue({ toArray: mockToArray });
    mockToArray.mockResolvedValue([]);
    mockCountDocuments.mockResolvedValue(0);

    mockHrFind.mockReturnValue({ sort: mockHrSort });
    mockHrSort.mockReturnValue({ limit: mockHrLimit });
    mockHrLimit.mockReturnValue({ toArray: mockHrToArray });
    mockHrToArray.mockResolvedValue([]);
  });

  describe("buildSymptomPrompt", () => {
    it("should build a prompt string", () => {
      const result = aiService.buildSymptomPrompt(["fever", "cough"], "2 days", "mild", "none");
      expect(result).toContain("fever, cough");
      expect(result).toContain("2 days");
      expect(result).toContain("mild");
      expect(result).toContain("none");
    });

    it("should handle empty optional fields", () => {
      const result = aiService.buildSymptomPrompt([]);
      expect(result).toContain("Not specified");
    });
  });

  describe("analyzeWithGroqFallback", () => {
    it("should try Groq first", async () => {
      mockAnalyzeWithGroq.mockResolvedValue('{"urgencyLevel":"routine"}');

      const result = await aiService.analyzeWithGroqFallback("symptom prompt");

      expect(result.urgencyLevel).toBe("routine");
    });

    it("should fallback to Gemini Flash when Groq fails", async () => {
      mockAnalyzeWithGroq.mockRejectedValue(new Error("Groq error"));
      mockGenerateWithFlash.mockResolvedValue('{"urgencyLevel":"soon"}');

      const result = await aiService.analyzeWithGroqFallback("symptom prompt");

      expect(result.urgencyLevel).toBe("soon");
    });

    it("should return fallback when both fail", async () => {
      mockAnalyzeWithGroq.mockRejectedValue(new Error("Groq error"));
      mockGenerateWithFlash.mockRejectedValue(new Error("Gemini error"));

      const result = await aiService.analyzeWithGroqFallback("symptom prompt");

      expect(result.urgencyLevel).toBe("routine");
      expect(result.disclaimer).toBeDefined();
    });
  });

  describe("analyzeSymptoms", () => {
    it("should analyze symptoms and save to DB", async () => {
      mockAnalyzeWithGroq.mockResolvedValue('{"urgencyLevel":"routine","possibleConditions":[],"recommendations":["Rest"],"warningSignsToWatch":[],"shouldSeeDoctor":false}');
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await aiService.analyzeSymptoms(mockUserId, ["fever"], "2 days", "mild");

      expect(result._id).toEqual(insertedId);
      expect(result.patientId).toEqual(mockOid);
    });
  });

  describe("analyzeReport", () => {
    it("should analyze report with vision", async () => {
      mockAnalyzeImageWithVision.mockResolvedValue('{"reportType":"blood","parameters":[],"overallAssessment":"Normal","followUpActions":[],"urgencyLevel":"routine","disclaimer":"Disc"}');
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await aiService.analyzeReport(mockUserId, "blood", "https://img.url");

      expect(result._id).toBeDefined();
      expect(result.reportType).toBe("blood");
    });

    it("should handle vision analysis failure", async () => {
      mockAnalyzeImageWithVision.mockRejectedValue(new Error("Vision error"));
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });

      const result = await aiService.analyzeReport(mockUserId, "blood", "https://img.url");

      expect(result.reportType).toBe("blood");
      expect(result.aiAnalysis.summary).toBeDefined();
    });
  });

  describe("chatMessage", () => {
    it("should create new session and stream chat", async () => {
      mockFindOne.mockResolvedValue(null);
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });
      mockStreamChat.mockResolvedValue("AI response");
      mockGenerateWithFlash.mockResolvedValue('["question1","question2","question3"]');
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue({
        _id: insertedId,
        participants: [mockOid],
        messages: [],
      });

      const result = await aiService.chatMessage(mockUserId, "Hello", undefined, jest.fn());

      expect(result.followUps).toHaveLength(3);
      expect(result.session).toBeDefined();
    });

    it("should reuse existing session when sessionId provided", async () => {
      const sessionId = new ObjectId();
      mockFindOne.mockResolvedValue({
        _id: sessionId,
        participants: [mockOid],
        messages: [{ senderId: mockOid, content: "Hi", timestamp: new Date() }],
      });
      mockStreamChat.mockResolvedValue("Response");
      mockGenerateWithFlash.mockResolvedValue('["q1","q2","q3"]');
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue({
        _id: sessionId,
        participants: [mockOid],
        messages: [],
      });

      const result = await aiService.chatMessage(mockUserId, "Hello", sessionId.toString(), jest.fn());

      expect(result.session).toBeDefined();
    });

    it("should handle streaming failure gracefully", async () => {
      mockFindOne.mockResolvedValue(null);
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });
      mockStreamChat.mockRejectedValue(new Error("Stream error"));
      mockGenerateWithFlash.mockResolvedValue('["q1","q2","q3"]');
      const onChunk = jest.fn();
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue({
        _id: insertedId,
        participants: [mockOid],
        messages: [],
      });

      const result = await aiService.chatMessage(mockUserId, "Hello", undefined, onChunk);

      expect(onChunk).toHaveBeenCalled();
      expect(result.session).toBeDefined();
    });

    it("should use fallback follow-ups when generation fails", async () => {
      mockFindOne.mockResolvedValue(null);
      const insertedId = new ObjectId();
      mockInsertOne.mockResolvedValue({ insertedId });
      mockStreamChat.mockResolvedValue("AI response");
      mockGenerateWithFlash.mockRejectedValue(new Error("Follow-up error"));
      mockUpdateOne.mockResolvedValue({});
      mockFindOne.mockResolvedValue({
        _id: insertedId,
        participants: [mockOid],
        messages: [],
      });

      const result = await aiService.chatMessage(mockUserId, "Hello");

      expect(result.followUps).toEqual([
        "What are the common causes?",
        "When should I see a doctor?",
        "Are there any home remedies?",
      ]);
    });
  });

  describe("generateBlog", () => {
    it("should generate a blog post", async () => {
      mockGenerateWithPro.mockResolvedValue('{"title":"Health Tips","content":"Content here","metaDescription":"SEO desc","tags":["health"],"readTime":5,"keyTakeaways":["Takeaway"]}');

      const result = await aiService.generateBlog("Health Tips", "general", "informative");

      expect(result.title).toBe("Health Tips");
    });

    it("should return fallback on parse failure", async () => {
      mockGenerateWithPro.mockResolvedValue("invalid json");

      const result = await aiService.generateBlog("Health Tips");

      expect(result.title).toBe("Health Tips");
      expect(result.keyTakeaways).toBeDefined();
    });
  });

  describe("getRecommendations", () => {
    it("should generate recommendations", async () => {
      mockGenerateWithPro.mockResolvedValue('{"recommendations":[{"name":"Vitamin D","type":"supplement"}],"itemsToAvoid":[],"lifestyleTips":[],"monitoringSuggestions":[],"disclaimer":"Disc"}');

      const result = await aiService.getRecommendations(mockUserId, ["fatigue"]);

      expect(result.recommendations).toHaveLength(1);
    });
  });

  describe("getHealthInsights", () => {
    it("should return empty insights when no records", async () => {
      mockHrToArray.mockResolvedValue([]);

      const result = await aiService.getHealthInsights(mockUserId);

      expect(result.trends).toEqual([]);
      expect(result.overallAssessment).toContain("Not enough data");
    });

    it("should generate insights from health records", async () => {
      mockHrToArray.mockResolvedValue([{ _id: new ObjectId(), chronicConditions: ["Diabetes"] }]);
      mockGenerateWithPro.mockResolvedValue('{"trends":[{"metric":"weight","direction":"stable"}],"notableChanges":[],"recommendations":[],"areasNeedingAttention":[],"positiveProgress":[],"overallAssessment":"Good","disclaimer":"Disc"}');

      const result = await aiService.getHealthInsights(mockUserId);

      expect(result.trends).toHaveLength(1);
    });
  });

  describe("classifyTags", () => {
    it("should classify tags", async () => {
      mockGenerateWithFlash.mockResolvedValue('{"tags":["health","wellness"],"category":"General"}');

      const result = await aiService.classifyTags("Health Tips", "Wellness advice");

      expect(result.tags).toEqual(["health", "wellness"]);
    });

    it("should reject when AI call fails", async () => {
      mockGenerateWithFlash.mockRejectedValue(new Error("AI error"));

      await expect(aiService.classifyTags("Health Wellness Tips", "Description")).rejects.toThrow("AI error");
    });
  });

  describe("getHistory", () => {
    function makeChain() {
      const chain: any = { toArray: mockToArray };
      chain.sort = jest.fn(() => chain);
      chain.skip = jest.fn(() => chain);
      chain.limit = jest.fn(() => chain);
      return chain;
    }

    beforeEach(() => {
      mockFind.mockReturnValue(makeChain());
    });

    it("should return merged paginated history", async () => {
      mockCountDocuments.mockResolvedValue(3);
      mockToArray.mockResolvedValue([
        { _id: new ObjectId(), patientId: mockOid, timestamp: new Date() },
      ]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await aiService.getHistory(mockUserId, { page: 1, limit: 10 });

      expect(result.data).toBeDefined();
      expect(result.pagination).toBeDefined();
    });

    it("should filter by symptom type", async () => {
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue([{ _id: new ObjectId() }]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await aiService.getHistory(mockUserId, { page: 1, limit: 10, type: "symptom" });

      expect(result.data).toHaveLength(1);
    });

    it("should filter by report type", async () => {
      mockCountDocuments.mockResolvedValue(1);
      mockToArray.mockResolvedValue([{ _id: new ObjectId() }]);
      const paginationModule = require("../utils/pagination.js");
      paginationModule.paginate.mockResolvedValue({ pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } });

      const result = await aiService.getHistory(mockUserId, { page: 1, limit: 10, type: "report" });

      expect(result.data).toHaveLength(1);
    });
  });
});
