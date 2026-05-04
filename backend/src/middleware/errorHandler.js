import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  logger.error(err);
  // In development return the original error message/stack to help debugging
  if (process.env.NODE_ENV !== "production") {
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: err.message || "Something went wrong", stack: err.stack }
    });
  }

  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
  });
}
