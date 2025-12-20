import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny } from "zod";

export const tryCatch = <T extends RequestHandler>(
  handler: T
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

function zodErrorToDetails(err: any) {
  const issues = err?.issues;
  if (!Array.isArray(issues)) return undefined;

  return issues.map((i: any) => ({
    path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
    message: String(i.message ?? "Invalid value"),
  }));
}

export const validateBody = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: zodErrorToDetails(parsed.error),
      });
    }
    req.body = parsed.data;
    next();
  };
};

export const validateQuery = (schema: ZodTypeAny): RequestHandler => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: zodErrorToDetails(parsed.error),
      });
    }
    req.query = parsed.data;
    next();
  };
};
