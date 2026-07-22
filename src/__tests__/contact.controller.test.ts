import { Request, Response } from "express";

jest.mock("../services/contact.service.js", () => ({
  submitContactForm: jest.fn(),
}));

import * as contactService from "../services/contact.service.js";
import * as contactController from "../controllers/contact.controller.js";

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

describe("Contact Controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("submitContactForm", () => {
    it("should submit contact form successfully", async () => {
      (contactService.submitContactForm as jest.Mock).mockResolvedValue(undefined);

      const req = {
        body: { name: "John", email: "john@test.com", subject: "Question", message: "Hello" },
      } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(contactService.submitContactForm).toHaveBeenCalledWith({
        name: "John",
        email: "john@test.com",
        subject: "Question",
        message: "Hello",
      });
      expect(res.statusCode).toBe(201);
      expect(res.jsonData).toEqual({
        success: true,
        message: "Message sent successfully",
        data: null,
      });
    });

    it("should return 400 when required fields are missing", async () => {
      const req = { body: { name: "John" } } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toEqual({
        success: false,
        message: "All fields are required",
      });
    });

    it("should return 400 when email is missing", async () => {
      const req = { body: { name: "John", subject: "Test", message: "Hello" } } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when subject is missing", async () => {
      const req = { body: { name: "John", email: "john@test.com", message: "Hello" } } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(400);
    });

    it("should return 400 when message is missing", async () => {
      const req = { body: { name: "John", email: "john@test.com", subject: "Test" } } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(400);
    });

    it("should handle errors from service", async () => {
      (contactService.submitContactForm as jest.Mock).mockRejectedValue(new Error("DB error"));

      const req = {
        body: { name: "John", email: "john@test.com", subject: "Question", message: "Hello" },
      } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "DB error",
      });
    });

    it("should return generic error for non-Error throws", async () => {
      (contactService.submitContactForm as jest.Mock).mockRejectedValue("string error");

      const req = {
        body: { name: "John", email: "john@test.com", subject: "Question", message: "Hello" },
      } as unknown as Request;
      const res = mockRes();

      await contactController.submitContactForm(req, res as Response);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        success: false,
        message: "Failed to submit contact form",
      });
    });
  });
});
