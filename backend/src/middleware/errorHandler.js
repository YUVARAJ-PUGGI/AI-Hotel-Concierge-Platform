import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  logger.error(err);
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" }
  });
}
