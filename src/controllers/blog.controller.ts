import { Request, Response } from "express";
import * as blogService from "../services/blog.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { uploadToImageBB } from "../services/upload.service.js";

function getUserId(req: Request, res: Response): string | null {
  const userId = req.user?.userId;
  if (!userId) {
    sendError(res, "Not authenticated", 401);
    return null;
  }
  return userId;
}

export async function getAllBlogs(req: Request, res: Response): Promise<void> {
  try {
    const result = await blogService.getAllBlogs(req.query as any);
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch blogs");
  }
}

export async function getBlogBySlug(req: Request, res: Response): Promise<void> {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);
    if (!blog) {
      sendError(res, "Blog not found", 404);
      return;
    }
    sendSuccess(res, blog);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch blog");
  }
}

export async function getBlogById(req: Request, res: Response): Promise<void> {
  try {
    const blog = await blogService.getBlogById(req.params.id);
    if (!blog) {
      sendError(res, "Blog not found", 404);
      return;
    }
    sendSuccess(res, blog);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to fetch blog");
  }
}

export async function createBlog(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    let coverImage: string | undefined;
    if (req.file) {
      coverImage = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const blog = await blogService.createBlog({
      ...req.body,
      authorId: userId,
      coverImage: coverImage ?? req.body.coverImage,
    });
    sendSuccess(res, blog, "Blog created", 201);
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to create blog");
  }
}

export async function updateBlog(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await blogService.getBlogByIdInternal(req.params.id);
    if (!existing) {
      sendError(res, "Blog not found", 404);
      return;
    }
    if (existing.authorId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to update this blog", 403);
      return;
    }

    let coverImage: string | undefined;
    if (req.file) {
      coverImage = await uploadToImageBB(req.file.buffer, req.file.originalname);
    }

    const updateData = req.file
      ? { ...req.body, coverImage }
      : req.body;

    const blog = await blogService.updateBlog(req.params.id, updateData);
    sendSuccess(res, blog, "Blog updated");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to update blog");
  }
}

export async function deleteBlog(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const existing = await blogService.getBlogByIdInternal(req.params.id);
    if (!existing) {
      sendError(res, "Blog not found", 404);
      return;
    }
    if (existing.authorId.toString() !== userId && req.user?.role !== "admin") {
      sendError(res, "Not authorized to delete this blog", 403);
      return;
    }
    await blogService.deleteBlog(req.params.id);
    sendSuccess(res, null, "Blog deleted");
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : "Failed to delete blog");
  }
}
