import mongoose from "mongoose";
import { fail } from "../utils/apiResponse.js";

export function validateObjectId(paramName) {
  return function validator(req, res, next) {
    const value = req.params[paramName] || req.body[paramName];
    if (!value || !mongoose.isValidObjectId(value)) {
      return fail(res, "INVALID_ID", `Invalid ${paramName}`, 400);
    }
    return next();
  };
}
