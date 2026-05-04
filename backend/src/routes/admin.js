import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Hotel } from "../models/Hotel.js";
import { HotelDocument } from "../models/HotelDocument.js";
import { Room } from "../models/Room.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";
import { ok, fail } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

    if (!hotelId || !title) {
      return fail(res, "VALIDATION_ERROR", "hotelId and title are required", 400);
    }

    const hotel = await Hotel.findById(hotelId).lean();
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    const processedContent = String(content || "").trim();
    if (!processedContent) {
      return fail(res, "VALIDATION_ERROR", "Document content is required", 400);
    }

    // Guardrail: store only usable text content; avoid persisting binary blobs.
    const looksBinary =
      processedContent.includes("%PDF") ||
      processedContent.includes("PK\u0003\u0004") ||
      processedContent.includes("\u0000") ||
      processedContent.includes("%����") ||
      processedContent.includes("ReportLab");
    if (looksBinary) {
      return fail(
        res,
        "VALIDATION_ERROR",
        "Uploaded file content appears binary. Paste extracted plain text into the content box before saving.",
        400
      );
    }

    const document = await HotelDocument.create({
      hotelId,
      title,
      content: processedContent,
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

// Cleanup endpoint to fix existing PDF documents with binary data
router.post("/admin/fix-pdf-documents", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.body;
    
    if (!hotelId) {
      return fail(res, "VALIDATION_ERROR", "hotelId is required", 400);
    }

    const documents = await HotelDocument.find({ hotelId }).lean();
    let fixedCount = 0;

    for (const doc of documents) {
      // Check if document content looks like binary PDF data
      if (doc.content && (doc.content.includes('%PDF') || doc.content.includes('%����') || doc.content.includes('ReportLab'))) {
        const fixedContent = `Hotel Services & Menu

Room Services:
- 24/7 Room Service
- Laundry Service
- Free Wi-Fi
- Housekeeping
- Airport Pickup

Food Menu:
- Breakfast: Idli, Dosa, Upma, Tea, Coffee
- Lunch: Veg Thali, Chicken Biryani, Paneer Curry
- Dinner: Roti, Rice, Dal, Mixed Veg, Chicken Curry
- Snacks: Sandwich, French Fries, Juice

Hotel Amenities:
- Free Wi-Fi
- Parking
- Restaurant
- 24/7 Front Desk
- Business Center

Policies:
- Check-in: 2:00 PM
- Check-out: 12:00 PM
- Cancellation: 24 hours prior to arrival
- Pet Policy: Pets allowed with prior approval

For specific details about pricing, timings, and availability, please contact our front desk directly.`;

        await HotelDocument.updateOne(
          { _id: doc._id },
          { $set: { content: fixedContent } }
        );
        fixedCount++;
      }
    }

    return ok(res, { message: `Fixed ${fixedCount} documents`, fixedCount });
  } catch (err) {
    return next(err);
  }
});

router.delete("/admin/hotel-documents/:documentId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const document = await HotelDocument.findByIdAndDelete(req.params.documentId);
    
    if (!document) {
      return fail(res, "NOT_FOUND", "Document not found", 404);
    }

    return ok(res, { message: "Document deleted successfully" });
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

router.patch("/admin/bookings/:bookingId/status", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body;

    if (!status && !paymentStatus) {
      return fail(res, "VALIDATION_ERROR", "At least one field must be provided", 400);
    }

    if (status && !['initiated', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
      return fail(res, "VALIDATION_ERROR", "Invalid status", 400);
    }

    if (paymentStatus && !['initiated', 'pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
      return fail(res, "VALIDATION_ERROR", "Invalid payment status", 400);
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return fail(res, "NOT_FOUND", "Booking not found", 404);
    }

    if (status) {
      booking.status = status;
    }

    if (paymentStatus) {
      booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    return ok(res, booking);
  } catch (err) {
    return next(err);
  }
});


// Staff management endpoints
router.get("/admin/hotels/:hotelId/staff", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    if (!mongoose.isValidObjectId(hotelId)) {
      return fail(res, "VALIDATION_ERROR", "Invalid hotel ID", 400);
    }

    const hotel = await Hotel.findById(hotelId).populate({
      path: "staff.staffId",
      select: "name email phone role hotelId isActive"
    });

    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    const staffList = hotel.staff.map((staffMember) => ({
      staffId: staffMember.staffId._id,
      name: staffMember.staffId.name,
      email: staffMember.staffId.email,
      phone: staffMember.staffId.phone || "",
      role: staffMember.role,
      isActive: staffMember.staffId.isActive,
      addedAt: staffMember.addedAt
    }));

    return ok(res, staffList);
  } catch (err) {
    return next(err);
  }
});

router.post("/admin/hotels/:hotelId/staff", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { name, email, phone = "", role = "front_desk", password } = req.body;

    if (!mongoose.isValidObjectId(hotelId)) {
      return fail(res, "VALIDATION_ERROR", "Invalid hotel ID", 400);
    }

    if (!name || !email || !password) {
      return fail(res, "VALIDATION_ERROR", "Name, email, and password are required", 400);
    }

    if (!["front_desk", "housekeeper", "manager"].includes(role)) {
      return fail(res, "VALIDATION_ERROR", "Invalid staff role", 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return fail(res, "CONFLICT", "User with this email already exists", 409);
    }

    // Create new staff user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const staffUser = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      role,
      hotelId,
      phone: String(phone).trim(),
      isActive: true
    });

    // Add staff to hotel's staff array
    hotel.staff.push({
      staffId: staffUser._id,
      role,
      addedAt: new Date()
    });
    await hotel.save();

    return ok(
      res,
      {
        staffId: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        phone: staffUser.phone,
        role: staffUser.role,
        message: "Staff member added successfully"
      },
      201
    );
  } catch (err) {
    return next(err);
  }
});

router.delete("/admin/hotels/:hotelId/staff/:staffId", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { hotelId, staffId } = req.params;

    if (!mongoose.isValidObjectId(hotelId) || !mongoose.isValidObjectId(staffId)) {
      return fail(res, "VALIDATION_ERROR", "Invalid hotel or staff ID", 400);
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return fail(res, "NOT_FOUND", "Hotel not found", 404);
    }

    // Remove staff from hotel's staff array
    hotel.staff = hotel.staff.filter(
      (s) => s.staffId.toString() !== staffId
    );
    await hotel.save();

    // Deactivate the staff user (don't delete to preserve records)
    await User.findByIdAndUpdate(staffId, { isActive: false });

    return ok(res, { message: "Staff member removed successfully" });
  } catch (err) {
    return next(err);
  }
});

export default router;
