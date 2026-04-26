import { Router } from "express";
import { Hotel } from "../models/Hotel.js";
import { Room } from "../models/Room.js";
import { Booking } from "../models/Booking.js";
import { ok } from "../utils/apiResponse.js";

const router = Router();

router.post("/hotels/search", async (req, res, next) => {
  try {
    const {
      lng,
      lat,
      maxDistanceMeters = 20000,
      maxPrice = null,
      minRating = 0,
      amenities = [],
      limit = 30,
      showAll = false
    } = req.body;

    const parsedLng = Number(lng);
    const parsedLat = Number(lat);
    const parsedMaxDistance = Number(maxDistanceMeters);
    const parsedMaxPrice = Number(maxPrice);
    const parsedMinRating = Number(minRating);
    const parsedLimit = Math.min(Math.max(Number(limit) || 30, 1), 50);

    const hasGeo =
      lng !== null &&
      lat !== null &&
      lng !== undefined &&
      lat !== undefined &&
      Number.isFinite(parsedLng) &&
      Number.isFinite(parsedLat);

    const baseMatch = {};
    if (Number.isFinite(parsedMaxPrice)) {
      baseMatch.startingPrice = { $lte: parsedMaxPrice };
    }
    if (Number.isFinite(parsedMinRating) && parsedMinRating > 0) {
      baseMatch.rating = { $gte: parsedMinRating };
    }
    if (Array.isArray(amenities) && amenities.length > 0) {
      baseMatch.amenities = { $all: amenities };
    }

    const hotels = hasGeo && !showAll
      ? await Hotel.aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: [parsedLng, parsedLat] },
              distanceField: "distanceMeters",
              maxDistance: Number.isFinite(parsedMaxDistance) ? parsedMaxDistance : 20000,
              spherical: true,
              query: baseMatch
            }
          },
          { $limit: parsedLimit }
        ])
      : await Hotel.aggregate([
          { $match: baseMatch },
          { $sort: { rating: -1, startingPrice: 1 } },
          { $limit: parsedLimit }
        ]);

    console.log(`Found ${hotels.length} hotels, hasGeo: ${hasGeo}, showAll: ${showAll}`);

    const hotelIds = hotels.map((hotel) => hotel._id);
    const readyRooms = await Room.aggregate([
      { $match: { hotelId: { $in: hotelIds }, status: "ready" } },
      { $group: { _id: "$hotelId", readyRooms: { $sum: 1 } } }
    ]);

    const roomCountByHotel = new Map();
    readyRooms.forEach((room) => {
      roomCountByHotel.set(String(room._id), room.readyRooms);
    });

    const maxDistanceForScore = Number.isFinite(parsedMaxDistance) ? parsedMaxDistance : 20000;
    const maxPriceForScore = Number.isFinite(parsedMaxPrice) ? parsedMaxPrice : 12000;
    const clamp01 = (value) => Math.max(0, Math.min(1, value));

    const data = hotels
      .map((hotel) => {
        const readyRoomCount = roomCountByHotel.get(String(hotel._id)) || 0;
        const ratingScore = clamp01((hotel.rating || 0) / 5);
        const priceScore = clamp01(1 - (hotel.startingPrice || 0) / maxPriceForScore);
        const distanceScore = hasGeo
          ? clamp01(1 - (hotel.distanceMeters || maxDistanceForScore) / maxDistanceForScore)
          : 0.5;
        const availabilityScore = clamp01(readyRoomCount / 10);
        const rankScore = Number(
          (ratingScore * 0.45 + priceScore * 0.2 + distanceScore * 0.25 + availabilityScore * 0.1).toFixed(3)
        );

        return {
          id: hotel._id,
          name: hotel.name,
          locationText: hotel.locationText,
          rating: hotel.rating,
          startingPrice: hotel.startingPrice,
          photoUrl: hotel.photoUrl,
          amenities: hotel.amenities,
          readyRooms: readyRoomCount,
          distanceMeters: hasGeo ? Math.round(hotel.distanceMeters || 0) : null,
          rankScore
        };
      })
      // Remove the filter that requires readyRooms > 0
      // .filter((hotel) => hotel.readyRooms > 0)
      .sort((a, b) => b.rankScore - a.rankScore);

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
    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const rooms = await Room.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 }).lean();
    
    // Format rooms for frontend
    const formattedRooms = rooms.map(room => ({
      id: room._id,
      roomNumber: room.roomNumber,
      type: room.type,
      capacity: room.capacity || room.maxOccupancy,
      amenities: room.amenities || [],
      status: room.status,
      price: room.price || hotel.startingPrice
    }));

    return ok(res, formattedRooms);
  } catch (err) {
    return next(err);
  }
});

router.post("/hotels/:hotelId/rooms/availability", async (req, res, next) => {
  try {
    const { checkInDate, checkOutDate } = req.body;
    
    console.log("Availability check request:", {
      hotelId: req.params.hotelId,
      checkInDate,
      checkOutDate
    });
    
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        success: false, 
        error: { code: "VALIDATION_ERROR", message: "checkInDate and checkOutDate are required" } 
      });
    }

    const hotel = await Hotel.findById(req.params.hotelId).lean();
    if (!hotel) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Hotel not found" } });
    }

    const rooms = await Room.find({ hotelId: req.params.hotelId }).sort({ roomNumber: 1 }).lean();
    console.log("Found rooms:", rooms.length);
    
    const requestedCheckIn = new Date(checkInDate);
    const requestedCheckOut = new Date(checkOutDate);
    
    // Get all bookings that might conflict with the requested dates
    const conflictingBookings = await Booking.find({
      hotelId: req.params.hotelId,
      status: { $in: ["confirmed", "checked_in"] }, // Only consider active bookings
      $or: [
        // Booking starts during requested period
        {
          checkInDate: { $gte: requestedCheckIn, $lt: requestedCheckOut }
        },
        // Booking ends during requested period
        {
          checkOutDate: { $gt: requestedCheckIn, $lte: requestedCheckOut }
        },
        // Booking spans the entire requested period
        {
          checkInDate: { $lte: requestedCheckIn },
          checkOutDate: { $gte: requestedCheckOut }
        }
      ]
    }).lean();
    
    console.log("Conflicting bookings found:", conflictingBookings.length);
    console.log("Conflicting bookings:", conflictingBookings);
    
    // Create a set of booked room IDs for the requested dates
    const bookedRoomIds = new Set(conflictingBookings.map(booking => booking.roomId.toString()));
    console.log("Booked room IDs:", Array.from(bookedRoomIds));
    
    // Format rooms with availability status
    const roomsWithAvailability = rooms.map(room => {
      const isBooked = bookedRoomIds.has(room._id.toString());
      const isReady = room.status === "ready";
      const isAvailable = isReady && !isBooked;
      
      console.log(`Room ${room.roomNumber}:`, {
        status: room.status,
        isReady,
        isBooked,
        isAvailable
      });
      
      return {
        id: room._id,
        roomNumber: room.roomNumber,
        type: room.type,
        capacity: room.capacity || room.maxOccupancy,
        amenities: room.amenities || [],
        status: room.status,
        price: room.price || hotel.startingPrice,
        isAvailable
      };
    });

    console.log("Returning rooms with availability:", roomsWithAvailability);
    return ok(res, roomsWithAvailability);
  } catch (err) {
    console.error("Error in availability check:", err);
    return next(err);
  }
});

export default router;
