import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Hotel } from "../models/Hotel.js";
import { HotelDocument } from "../models/HotelDocument.js";
import { ok, fail } from "../utils/apiResponse.js";

const router = Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return fail(res, "FORBIDDEN", "Admin access required", 403);
  }

  return next();
}

router.get("/admin/hotels", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const hotels = await Hotel.find({}).sort({ createdAt: -1 }).lean();
    return ok(
      res,
      hotels.map((hotel) => ({
        id: hotel._id,
        name: hotel.name,
        locationText: hotel.locationText,
        startingPrice: hotel.startingPrice,
        photoUrl: hotel.photoUrl,
        rating: hotel.rating
      }))
    );
  } catch (err) {
    return next(err);
  }
});

router.get("/admin/hotel-documents", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    const query = hotelId ? { hotelId } : {};
    const documents = await HotelDocument.find(query).sort({ createdAt: -1 }).lean();
    return ok(res, documents);
  } catch (err) {
    return next(err);
  }
});

router.post("/admin/hotel-documents", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId, title, content, sourceName, tags = [] } = req.body;

    if (!hotelId || !title || !content) {
      return fail(res, "VALIDATION_ERROR", "hotelId, title, and content are required", 400);
    }

    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    const document = await HotelDocument.create({
      hotelId,
      title,
      content,
      sourceName: sourceName || "manual upload",
      tags: Array.isArray(tags) ? tags : String(tags).split(",").map((tag) => tag.trim()).filter(Boolean),
      createdBy: req.user.email || req.user.userId || null
    });

    return ok(res, document, 201);
  } catch (err) {
    return next(err);
  }
});

export default router;