import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { config } from "../config.js";
import { ok, fail } from "../utils/apiResponse.js";

const router = Router();

router.post("/auth/register", async (req, res, next) => {
  try {
    const { name, email, password, role, hotelId } = req.body;

    if (!name || !email || !password) {
      return fail(res, "BAD_REQUEST", "Name, email, and password are required.", 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return fail(res, "CONFLICT", "User with this email already exists.", 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "guest",
      hotelId: hotelId || null
    });

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      hotelId: user.hotelId ? user.hotelId.toString() : null
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });

    return ok(res, { token, user: payload });
  } catch (err) {
    return next(err);
  }
});

router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return fail(res, "BAD_REQUEST", "Email and password are required.", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return fail(res, "UNAUTHORIZED", "Invalid email or password.", 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return fail(res, "UNAUTHORIZED", "Invalid email or password.", 401);
    }

    const payload = {
      userId: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      hotelId: user.hotelId ? user.hotelId.toString() : null
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });

    return ok(res, { token, user: payload });
  } catch (err) {
    return next(err);
  }
});

export default router;
