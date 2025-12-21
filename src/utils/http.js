// Express helpers (plain JS)

export const tryCatch = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};

function zodErrorToDetails(err) {
  const issues = err?.issues;
  if (!Array.isArray(issues)) return undefined;

  return issues.map((i) => ({
    path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
    message: String(i.message ?? "Invalid value"),
  }));
}

export const validateBody = (schema) => {
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

// NOTE: Works in Express 4 and 5. In Express 5 `req.query` is read-only, so we store the validated query separately.
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid query parameters",
        details: zodErrorToDetails(parsed.error),
      });
    }

    req.validatedQuery = parsed.data;
    res.locals.query = parsed.data;
    next();
  };
};
