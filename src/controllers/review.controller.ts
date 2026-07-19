import { Request, Response } from "express";
import * as reviewService from "../services/review.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getAllReviews(req: Request, res: Response): Promise<void> {
  try {
    const result = await reviewService.getAllReviews(req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch reviews");
  }
}

export async function getReviewById(req: Request, res: Response): Promise<void> {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    if (!review) {
      sendError(res, "Review not found", 404);
      return;
    }
    sendSuccess(res, review);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch review");
  }
}

export async function createReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const review = await reviewService.createReview({
      ...req.body,
      reviewerId: userId,
    });
    sendSuccess(res, review, "Review created", 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create review";
    if ((err as any)?.code === 11000) {
      sendError(res, "You have already reviewed this item", 409);
      return;
    }
    sendError(res, message);
  }
}

export async function updateReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const review = await reviewService.getReviewById(req.params.id);
    if (!review) {
      sendError(res, "Review not found", 404);
      return;
    }
    if (review.reviewerId.toString() !== userId) {
      sendError(res, "Not authorized to update this review", 403);
      return;
    }
    const updated = await reviewService.updateReview(req.params.id, req.body);
    sendSuccess(res, updated, "Review updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update review");
  }
}

export async function deleteReview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const review = await reviewService.getReviewById(req.params.id);
    if (!review) {
      sendError(res, "Review not found", 404);
      return;
    }
    if (review.reviewerId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this review", 403);
      return;
    }
    await reviewService.deleteReview(req.params.id);
    sendSuccess(res, null, "Review deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete review");
  }
}

export async function getReviewsByTarget(req: Request, res: Response): Promise<void> {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!["Doctor", "Medicine"].includes(targetType)) {
      sendError(res, "Invalid target type. Must be 'Doctor' or 'Medicine'", 400);
      return;
    }

    const result = await reviewService.getReviewsByTarget(
      targetType as "Doctor" | "Medicine",
      targetId,
      page,
      limit
    );
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch reviews");
  }
}

export async function approveReview(req: Request, res: Response): Promise<void> {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    if (!review) {
      sendError(res, "Review not found", 404);
      return;
    }
    const updated = await reviewService.approveReview(req.params.id);
    sendSuccess(res, updated, "Review approved");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to approve review");
  }
}
