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

router.post("/admin/hotels", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      name,
      description = "",
      locationText,
      startingPrice,
      photoUrl = "",
      rating,
      amenities = [],
      latitude,
      longitude
    } = req.body;

    if (!name || !locationText) {
      return fail(res, "VALIDATION_ERROR", "name and locationText are required", 400);
    }

    const parsedStartingPrice = Number(startingPrice);
    const parsedRating = Number(rating);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    const hasGeo = Number.isFinite(parsedLatitude) && Number.isFinite(parsedLongitude);

    const hotel = await Hotel.create({
      name: String(name).trim(),
      description: String(description || "").trim(),
      locationText: String(locationText).trim(),
      startingPrice: Number.isFinite(parsedStartingPrice) ? parsedStartingPrice : 2500,
      photoUrl: String(photoUrl || "").trim(),
      rating: Number.isFinite(parsedRating) ? parsedRating : 4.0,
      amenities: Array.isArray(amenities)
        ? amenities.map((item) => String(item).trim()).filter(Boolean)
        : String(amenities || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
      geo: hasGeo
        ? { type: "Point", coordinates: [parsedLongitude, parsedLatitude] }
        : { type: "Point", coordinates: [77.6205, 12.9352] }
    });

    return ok(
      res,
      {
        id: hotel._id,
        name: hotel.name,
        locationText: hotel.locationText,
        startingPrice: hotel.startingPrice,
        photoUrl: hotel.photoUrl,
        rating: hotel.rating,
        amenities: hotel.amenities
      },
      201
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