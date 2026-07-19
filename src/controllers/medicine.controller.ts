import { Request, Response } from "express";
import * as medicineService from "../services/medicine.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { uploadToImageBB } from "../services/upload.service.js";

export async function getAllMedicines(req: Request, res: Response): Promise<void> {
  try {
    const result = await medicineService.getAllMedicines(req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch medicines");
  }
}

export async function getMedicineById(req: Request, res: Response): Promise<void> {
  try {
    const medicine = await medicineService.getMedicineById(req.params.id);
    if (!medicine) {
      sendError(res, "Medicine not found", 404);
      return;
    }
    sendSuccess(res, medicine);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch medicine");
  }
}

export async function createMedicine(req: Request, res: Response): Promise<void> {
  try {
    let imageUrl: string | undefined;

    if (req.file) {
      imageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const medicine = await medicineService.createMedicine({
      ...req.body,
      image: imageUrl ?? req.body.image,
    });
    sendSuccess(res, medicine, "Medicine created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create medicine");
  }
}

export async function updateMedicine(req: Request, res: Response): Promise<void> {
  try {
    let imageUrl: string | undefined;

    if (req.file) {
      imageUrl = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const updateData = req.file
      ? { ...req.body, image: imageUrl }
      : req.body;

    const medicine = await medicineService.updateMedicine(req.params.id, updateData);
    if (!medicine) {
      sendError(res, "Medicine not found", 404);
      return;
    }
    sendSuccess(res, medicine, "Medicine updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update medicine");
  }
}

export async function deleteMedicine(req: Request, res: Response): Promise<void> {
  try {
    const medicine = await medicineService.deleteMedicine(req.params.id);
    if (!medicine) {
      sendError(res, "Medicine not found", 404);
      return;
    }
    sendSuccess(res, null, "Medicine deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete medicine");
  }
}

export async function searchMedicines(req: Request, res: Response): Promise<void> {
  try {
    const query = (req.query.q as string) || "";
    if (!query) {
      sendError(res, "Search query is required", 400);
      return;
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await medicineService.searchMedicines(query, page, limit);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to search medicines");
  }
}

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const categories = await medicineService.getCategories();
    sendSuccess(res, categories);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch categories");
  }
}

export async function getFeaturedMedicines(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 8;
    const medicines = await medicineService.getFeaturedMedicines(limit);
    sendSuccess(res, medicines);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch featured medicines");
  }
}
