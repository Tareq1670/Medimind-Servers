import { Request, Response } from "express";

jest.mock("../services/ai.service.js", () => ({
  analyzeSymptoms: jest.fn(),
  analyzeWithGroqFallback: jest.fn(),
  buildSymptomPrompt: jest.fn(),
  analyzeReport: jest.fn(),
  chatMessage: jest.fn(),
  generateBlog: jest.fn(),
  getRecommendations: jest.fn(),
  getHealthInsights: jest.fn(),
  classifyTags: jest.fn(),
  getHistory: jest.fn(),
}));

jest.mock("../services/upload.service.js", () => ({
  uploadToImageBB: jest.fn(),
}));

import * as aiService from "../services/ai.service.js";
import * as uploadService from "../services/upload.service.js";
import * as aiController from "../controllers/ai.controller.js";

function mockRes(): Partial<Response> & {
  statusCode?: number;
  jsonData?: unknown;
  writableEnded?: boolean;
  headers?: Record<string, string>;
  flushHeaders?: jest.Mock;
  write?: jest.Mock;
  end?: jest.Mock;
  on?: jest.Mock;
} {
  const res: any = {
    status: jest.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn().mockImplementation((data: unknown) => {
      res.jsonData = data;
      return res;
    }),
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
    writableEnded: false,
  };
  return res;
}

describe("AI Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("analyzeSymptoms", () => {
    it("should analyze symptoms for authenticated user", async () => {
      const mockAnalysis = { urgencyLevel: "routine" };
      (aiService.analyzeSymptoms as jest.Mock).mockResolvedValue(mockAnalysis);

      const req = {
        user: { userId: "user123" },
        body: { reportedSymptoms: ["fever"], duration: "2 days", severity: "mild", additionalInfo: "" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeSymptoms(req, res as Response);

      expect(aiService.analyzeSymptoms).toHaveBeenCalledWith("user123", ["fever"], "2 days", "mild", "");
      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({ success: true, message: "Symptom analysis complete", data: mockAnalysis });
    });

    it("should use groq fallback for unauthenticated user", async () => {
      const mockResult = { urgencyLevel: "routine" };
      (aiService.buildSymptomPrompt as jest.Mock).mockReturnValue("prompt");
      (aiService.analyzeWithGroqFallback as jest.Mock).mockResolvedValue(mockResult);

      const req = {
        user: null,
        body: { reportedSymptoms: ["fever"], duration: "2 days", severity: "mild", additionalInfo: "" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeSymptoms(req, res as Response);

      expect(aiService.analyzeWithGroqFallback).toHaveBeenCalledWith("prompt");
    });

    it("should handle errors", async () => {
      (aiService.analyzeSymptoms as jest.Mock).mockRejectedValue(new Error("AI error"));

      const req = {
        user: { userId: "user123" },
        body: { reportedSymptoms: ["fever"] },
      } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeSymptoms(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("analyzeReport", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {}, file: null } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeReport(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should return 400 when no image uploaded", async () => {
      const req = { user: { userId: "user123" }, body: {}, file: null } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeReport(req, res as Response);

      expect(res.statusCode).toBe(400);
    });

    it("should upload image and analyze report", async () => {
      (uploadService.uploadToImageBB as jest.Mock).mockResolvedValue("https://img.url");
      const mockAnalysis = { reportType: "blood" };
      (aiService.analyzeReport as jest.Mock).mockResolvedValue(mockAnalysis);

      const req = {
        user: { userId: "user123" },
        file: { buffer: Buffer.from("test"), originalname: "report.jpg" },
        body: { reportType: "blood", reportName: "CBC", additionalNotes: "" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeReport(req, res as Response);

      expect(uploadService.uploadToImageBB).toHaveBeenCalled();
      expect(aiService.analyzeReport).toHaveBeenCalledWith("user123", "blood", "https://img.url", "CBC", "");
      expect(res.statusCode).toBe(201);
    });

    it("should handle errors", async () => {
      (uploadService.uploadToImageBB as jest.Mock).mockRejectedValue(new Error("Upload failed"));

      const req = {
        user: { userId: "user123" },
        file: { buffer: Buffer.from("test"), originalname: "report.jpg" },
        body: { reportType: "blood" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.analyzeReport(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("chatMessage", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.chatMessage(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should stream chat response", async () => {
      const mockSession = { _id: "sess1", messages: [] };
      (aiService.chatMessage as jest.Mock).mockResolvedValue({ session: mockSession, followUps: [] });

      const req = {
        user: { userId: "user123" },
        body: { message: "Hello", sessionId: undefined },
        on: jest.fn(),
      } as unknown as Request;
      const res = mockRes();

      await aiController.chatMessage(req, res as Response);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
      expect(aiService.chatMessage).toHaveBeenCalledWith("user123", "Hello", undefined, expect.any(Function));
      expect(res.write).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it("should handle client disconnect", async () => {
      let closeHandler: (() => void) | null = null;
      const mockOn = jest.fn((event: string, handler: () => void) => {
        if (event === "close") closeHandler = handler;
      });
      (aiService.chatMessage as jest.Mock).mockImplementation(
        async (_uid: string, _msg: string, _sid: string | undefined, onChunk: (t: string) => void) => {
          closeHandler?.();
          onChunk("partial");
          return { session: { _id: "sess1" }, followUps: [] };
        }
      );

      const req = {
        user: { userId: "user123" },
        body: { message: "Hi" },
        on: mockOn,
      } as unknown as Request;
      const res = mockRes();

      await aiController.chatMessage(req, res as Response);

      expect(res.end).toHaveBeenCalled();
    });

    it("should handle streaming errors", async () => {
      (aiService.chatMessage as jest.Mock).mockRejectedValue(new Error("Stream error"));

      const req = {
        user: { userId: "user123" },
        body: { message: "Hi" },
        on: jest.fn(),
      } as unknown as Request;
      const res = mockRes();

      await aiController.chatMessage(req, res as Response);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining("error")
      );
    });
  });

  describe("generateBlog", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.generateBlog(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should generate blog", async () => {
      const mockBlog = { title: "Health Tips", content: "..." };
      (aiService.generateBlog as jest.Mock).mockResolvedValue(mockBlog);

      const req = {
        user: { userId: "user123" },
        body: { topic: "Health", audience: "general", tone: "informative" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.generateBlog(req, res as Response);

      expect(aiService.generateBlog).toHaveBeenCalledWith("Health", "general", "informative", undefined, undefined, undefined);
      expect(res.statusCode).toBe(201);
    });

    it("should handle errors", async () => {
      (aiService.generateBlog as jest.Mock).mockRejectedValue(new Error("Generation failed"));

      const req = {
        user: { userId: "user123" },
        body: { topic: "Health" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.generateBlog(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });

  describe("getRecommendations", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.getRecommendations(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should generate recommendations", async () => {
      const mockRecs = { recommendations: [] };
      (aiService.getRecommendations as jest.Mock).mockResolvedValue(mockRecs);

      const req = {
        user: { userId: "user123" },
        body: { symptoms: ["fever"], conditions: ["cold"], healthGoals: ["wellness"] },
      } as unknown as Request;
      const res = mockRes();

      await aiController.getRecommendations(req, res as Response);

      expect(aiService.getRecommendations).toHaveBeenCalledWith("user123", ["fever"], ["cold"], ["wellness"]);
      expect(res.jsonData).toEqual({ success: true, message: "Recommendations generated", data: mockRecs });
    });
  });

  describe("getHealthInsights", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.getHealthInsights(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should return health insights", async () => {
      const mockInsights = { trends: [] };
      (aiService.getHealthInsights as jest.Mock).mockResolvedValue(mockInsights);

      const req = { user: { userId: "user123" }, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.getHealthInsights(req, res as Response);

      expect(aiService.getHealthInsights).toHaveBeenCalledWith("user123");
      expect(res.jsonData).toEqual({ success: true, message: "Health insights generated", data: mockInsights });
    });
  });

  describe("classifyTags", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, body: {} } as unknown as Request;
      const res = mockRes();

      await aiController.classifyTags(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should classify tags", async () => {
      const mockTags = { tags: ["health"] };
      (aiService.classifyTags as jest.Mock).mockResolvedValue(mockTags);

      const req = {
        user: { userId: "user123" },
        body: { title: "Test", description: "Test description" },
      } as unknown as Request;
      const res = mockRes();

      await aiController.classifyTags(req, res as Response);

      expect(aiService.classifyTags).toHaveBeenCalledWith("Test", "Test description");
      expect(res.jsonData).toEqual({ success: true, message: "Tags generated", data: mockTags });
    });
  });

  describe("getHistory", () => {
    it("should return 401 when not authenticated", async () => {
      const req = { user: null, query: {} } as unknown as Request;
      const res = mockRes();

      await aiController.getHistory(req, res as Response);

      expect(res.statusCode).toBe(401);
    });

    it("should return paginated history", async () => {
      const mockHistory = { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      (aiService.getHistory as jest.Mock).mockResolvedValue(mockHistory);

      const req = { user: { userId: "user123" }, query: { page: "1", limit: "10" } } as unknown as Request;
      const res = mockRes();

      await aiController.getHistory(req, res as Response);

      expect(aiService.getHistory).toHaveBeenCalledWith("user123", { page: "1", limit: "10" });
      expect(res.jsonData).toEqual({ success: true, message: "Success", data: mockHistory });
    });

    it("should handle errors", async () => {
      (aiService.getHistory as jest.Mock).mockRejectedValue(new Error("History error"));

      const req = { user: { userId: "user123" }, query: {} } as unknown as Request;
      const res = mockRes();

      await aiController.getHistory(req, res as Response);

      expect(res.statusCode).toBe(500);
    });
  });
});
