import { Request, Response } from "express";

jest.mock("../services/chatSession.service.js", () => ({
  getAllSessions: jest.fn(),
  getSessionById: jest.fn(),
  createSession: jest.fn(),
  addMessage: jest.fn(),
  updateSessionStatus: jest.fn(),
  deleteSession: jest.fn(),
  isParticipant: jest.fn(),
}));

import * as chatService from "../services/chatSession.service.js";
import * as chatController from "../controllers/chatSession.controller.js";

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

describe("ChatSession Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllSessions", () => {
    it("should return sessions for authenticated user", async () => {
      const result = {
        data: [{ _id: "1", participants: [] }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      };
      (chatService.getAllSessions as jest.Mock).mockResolvedValue(result);

      const req = {
        query: {},
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.getAllSessions(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: result,
      });
    });

    it("should return 401 when not authenticated", async () => {
      const req = { query: {}, user: null } as unknown as Request;
      const res = mockRes();

      await chatController.getAllSessions(req, res as Response);

      expect(res.statusCode).toBe(401);
    });
  });

  describe("getSessionById", () => {
    it("should return session when participant", async () => {
      const session = { _id: "123", participants: ["user123"] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(true);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.getSessionById(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Success",
        data: session,
      });
    });

    it("should return 403 when not participant", async () => {
      const session = { _id: "123", participants: ["other-user"] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(false);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.getSessionById(req, res as Response);

      expect(res.statusCode).toBe(403);
    });

    it("should return 404 when not found", async () => {
      (chatService.getSessionById as jest.Mock).mockResolvedValue(null);

      const req = {
        params: { id: "nonexistent" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.getSessionById(req, res as Response);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("createSession", () => {
    it("should create a session", async () => {
      const newSession = { _id: "123", participants: ["user123", "doctor1"] };
      (chatService.createSession as jest.Mock).mockResolvedValue(newSession);

      const req = {
        user: { userId: "user123", role: "user" },
        body: { participants: ["doctor1"] },
      } as unknown as Request;
      const res = mockRes();

      await chatController.createSession(req, res as Response);

      expect(res.statusCode).toBe(201);
      expect(chatService.createSession).toHaveBeenCalledWith({
        participants: ["user123", "doctor1"],
      });
    });
  });

  describe("sendMessage", () => {
    it("should send message when participant", async () => {
      const session = { _id: "123", participants: ["user123"] };
      const updated = { ...session, messages: [{ content: "Hello" }] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(true);
      (chatService.addMessage as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: { content: "Hello" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.sendMessage(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Message sent",
        data: updated,
      });
    });

    it("should return 403 when not participant", async () => {
      const session = { _id: "123", participants: ["other-user"] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(false);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: { content: "Hello" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.sendMessage(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("updateSessionStatus", () => {
    it("should update status when participant", async () => {
      const session = { _id: "123", participants: ["user123"] };
      const updated = { ...session, status: "Closed" };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(true);
      (chatService.updateSessionStatus as jest.Mock).mockResolvedValue(updated);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
        body: { status: "Closed" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.updateSessionStatus(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Session status updated",
        data: updated,
      });
    });
  });

  describe("deleteSession", () => {
    it("should delete when participant", async () => {
      const session = { _id: "123", participants: ["user123"] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(true);
      (chatService.deleteSession as jest.Mock).mockResolvedValue(true);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.deleteSession(req, res as Response);

      expect(res.jsonData).toEqual({
        success: true,
        message: "Session deleted",
        data: null,
      });
    });

    it("should return 403 when not participant", async () => {
      const session = { _id: "123", participants: ["other-user"] };
      (chatService.getSessionById as jest.Mock).mockResolvedValue(session);
      (chatService.isParticipant as jest.Mock).mockReturnValue(false);

      const req = {
        params: { id: "123" },
        user: { userId: "user123", role: "user" },
      } as unknown as Request;
      const res = mockRes();

      await chatController.deleteSession(req, res as Response);

      expect(res.statusCode).toBe(403);
    });
  });
});
