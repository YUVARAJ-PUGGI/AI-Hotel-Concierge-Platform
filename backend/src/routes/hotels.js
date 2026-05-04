import { Router } from "express";
import { Hotel } from "../models/Hotel.js";
import { Room } from "../models/Room.js";
import { HotelDocument } from "../models/HotelDocument.js";
import { ok, fail } from "../utils/apiResponse.js";
import { config } from "../config.js";
import { postJsonWithTimeout } from "../utils/httpClient.js";

const router = Router();

router.post("/hotels/search", async (req, res, next) => {
  try {
    const { lng, lat, maxDistanceMeters = 20000, maxPrice = null } = req.body;
    const hasGeo =
      lng !== null &&
      lat !== null &&
      lng !== undefined &&
      lat !== undefined &&
      Number.isFinite(Number(lng)) &&
      Number.isFinite(Number(lat));

    const hotels = hasGeo
      ? await Hotel.find({
          geo: {
            $near: {
              $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
              $maxDistance: maxDistanceMeters
            }
          }
        }).limit(30)
      : await Hotel.find({}).sort({ rating: -1 }).limit(30);

    const hotelIds = hotels.map((hotel) => hotel._id);
    const rooms = await Room.find({ hotelId: { $in: hotelIds }, status: "ready" }).lean();

    const roomCountByHotel = new Map();
    rooms.forEach((room) => {
      const key = String(room.hotelId);
      roomCountByHotel.set(key, (roomCountByHotel.get(key) || 0) + 1);
    });

    const data = hotels
      .map((hotel) => ({
        id: hotel._id,
        name: hotel.name,
        locationText: hotel.locationText,
        rating: hotel.rating,
        startingPrice: hotel.startingPrice,
        photoUrl: hotel.photoUrl,
        amenities: hotel.amenities,
        readyRooms: roomCountByHotel.get(String(hotel._id)) || 0
      }))
      .filter((hotel) => hotel.readyRooms > 0 || maxPrice !== null || !hasGeo);

    return ok(res, data);
  } catch (err) {
    return next(err);
  }
});

router.get("/hotels/:hotelId", async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const readyRooms = await Room.countDocuments({ hotelId: hotel._id, status: "ready" });
    return ok(res, { ...hotel, readyRooms });
  } catch (err) {
    return next(err);
  }
});

router.get("/hotels/:hotelId/rooms", async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    
    const rooms = await Room.find({
      hotelId,
      status: "ready"
    }).select("_id roomNumber floor type price capacity maxOccupancy amenities").lean();

    return ok(res, rooms);
  } catch (err) {
    return next(err);
  }
});

router.post("/hotels/:hotelId/chat", async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return fail(res, "VALIDATION_ERROR", "message is required", 400);
    }

    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    // Fetch hotel documents for context
    const hotelDocuments = await HotelDocument.find({ hotelId }).sort({ createdAt: -1 }).limit(20).lean();
    
    // Build context for the AI
    const contexts = [
      `Hotel: ${hotel.name}. ${hotel.description || ""} Located at ${hotel.locationText}.`,
      `Amenities: ${(hotel.amenities || []).join(", ")}`,
      ...hotelDocuments.map((doc) => `${doc.title}: ${doc.content}`)
    ].filter(Boolean);

    // Call AI service for hotel-specific chat (not booking-specific)
    let aiResponse;
    try {
      aiResponse = await postJsonWithTimeout(`${config.aiServiceUrl}/chat`, {
        hotelId: String(hotelId),
        message,
        contexts
      }, config.aiTimeoutMs);
    } catch (err) {
      console.error("AI service error:", err);
      aiResponse = {
        answer: "I do not have that information right now. Please contact the hotel directly.",
        escalate: true,
        reason: "ai_timeout"
      };
    }

    return ok(res, {
      reply: aiResponse.answer || aiResponse.reply,
      escalate: aiResponse.escalate,
      reason: aiResponse.reason
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/hotels/:hotelId/chat/topics", async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const hotelDocuments = await HotelDocument.find({ hotelId }).sort({ createdAt: -1 }).limit(10).lean();
    
    if (hotelDocuments.length === 0) {
      return ok(res, {
        topics: [
          { id: "amenities", title: "Hotel Amenities", description: "What are the amenities available?" },
          { id: "services", title: "Services", description: "What services do you offer?" },
          { id: "policies", title: "Policies", description: "What are the hotel policies?" }
        ]
      });
    }

    const topics = hotelDocuments.map((doc) => ({
      id: doc._id,
      title: doc.title,
      description: doc.content.substring(0, 80) + "..."
    }));

    return ok(res, { topics });
  } catch (err) {
    return next(err);
  }
});

export default router;
