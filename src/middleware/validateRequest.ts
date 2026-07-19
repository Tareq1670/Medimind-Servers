import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { ParsedQs } from "qs";
import { ParamsDictionary } from "express-serve-static-core";

export function validateRequest(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body: Record<string, unknown>; query: Record<string, unknown>; params: Record<string, string> };
      req.body = parsed.body;
      if (parsed.query) {
        req.query = parsed.query as unknown as ParsedQs;
      }
      if (parsed.params) {
        req.params = parsed.params as unknown as ParamsDictionary;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = "issues" in err ? err.issues : (err as any).errors ?? [];
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: issues.map((e: { path: (string | number)[]; message: string }) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
