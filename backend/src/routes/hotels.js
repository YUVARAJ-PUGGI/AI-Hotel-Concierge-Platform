import { Router } from "express";
import { Hotel } from "../models/Hotel.js";
import { Room } from "../models/Room.js";
import { ok } from "../utils/apiResponse.js";

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

export default router;
