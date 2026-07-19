import { Request, Response } from "express";
import { uploadToImageBB } from "../services/upload.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, "Image file is required", 400);
      return;
    }

    const imageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    sendSuccess(res, { url: imageUrl }, "Image uploaded successfully", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to upload image");
  }
}
