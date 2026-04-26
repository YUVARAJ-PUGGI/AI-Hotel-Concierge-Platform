import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Hotel } from "../models/Hotel.js";
import { HotelDocument } from "../models/HotelDocument.js";
import { Room } from "../models/Room.js";
import { Booking } from "../models/Booking.js";
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

// Room management endpoints
router.get("/admin/rooms", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    
    if (!hotelId) {
      return fail(res, "VALIDATION_ERROR", "hotelId is required", 400);
    }

    const rooms = await Room.find({ hotelId }).sort({ roomNumber: 1 }).lean();
    return ok(res, rooms);
  } catch (err) {
    return next(err);
  }
});

router.post("/admin/rooms", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId, roomNumber, type, floor = 1, maxOccupancy = 2, capacity = 2, price = 2500, amenities = [], status = "ready" } = req.body;

    if (!hotelId || !roomNumber || !type) {
      return fail(res, "VALIDATION_ERROR", "hotelId, roomNumber, and type are required", 400);
    }

    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    // Check if room number already exists for this hotel
    const existingRoom = await Room.findOne({ hotelId, roomNumber }).lean();
    if (existingRoom) {
      return fail(res, "VALIDATION_ERROR", "Room number already exists for this hotel", 400);
    }

    const room = await Room.create({
      hotelId,
      roomNumber: String(roomNumber).trim(),
      type: String(type).trim(),
      floor: Number(floor) || 1,
      maxOccupancy: Number(maxOccupancy) || Number(capacity) || 2,
      capacity: Number(capacity) || Number(maxOccupancy) || 2,
      price: Number(price) || 2500,
      amenities: Array.isArray(amenities) ? amenities : [],
      status: status || "ready",
      statusUpdatedAt: new Date()
    });

    return ok(res, room, 201);
  } catch (err) {
    return next(err);
  }
});

router.delete("/admin/rooms/:roomId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.roomId);
    
    if (!room) {
      return fail(res, "NOT_FOUND", "Room not found", 404);
    }

    return ok(res, { message: "Room deleted successfully" });
  } catch (err) {
    return next(err);
  }
});

// Booking management endpoints
router.get("/admin/bookings", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.query;
    
    if (!hotelId) {
      return fail(res, "VALIDATION_ERROR", "hotelId is required", 400);
    }

    const bookings = await Booking.find({ hotelId })
      .populate('roomId', 'roomNumber type')
      .populate('guestId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    const formattedBookings = bookings.map(booking => ({
      id: booking._id,
      guestName: booking.guestId?.name || 'Unknown Guest',
      guestEmail: booking.guestId?.email || '',
      roomNumber: booking.roomId?.roomNumber || 'Unknown Room',
      roomType: booking.roomId?.type || '',
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      totalAmount: booking.totalAmount,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      govtIdType: booking.govtIdType,
      govtIdNumber: booking.govtIdNumber,
      createdAt: booking.createdAt
    }));

    return ok(res, formattedBookings);
  } catch (err) {
    return next(err);
  }
});

export default router;