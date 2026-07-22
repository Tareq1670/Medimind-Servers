import { Request, Response } from "express";
import * as contactService from "../services/contact.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function submitContactForm(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      sendError(res, "All fields are required", 400);
      return;
    }
    await contactService.submitContactForm({ name, email, subject, message });
    sendSuccess(res, null, "Message sent successfully", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to submit contact form");
  }
}
