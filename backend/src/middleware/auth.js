import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { fail } from "../utils/apiResponse.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return fail(res, "UNAUTHORIZED", "Missing access token", 401);
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch {
    return fail(res, "UNAUTHORIZED", "Invalid access token", 401);
  }
}
