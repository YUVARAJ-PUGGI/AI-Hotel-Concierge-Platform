import { Router } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth.js";
import { Room } from "../models/Room.js";
import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { ok, fail } from "../utils/apiResponse.js";
import { emitToBooking } from "../socket/emitter.js";

const router = Router();

router.post("/bookings", authenticate, async (req, res, next) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate, totalAmount, govtIdType, govtIdNumber } = req.body;

    // If roomId is provided, use that specific room, otherwise find any ready room
    const roomQuery = roomId 
      ? { _id: roomId, hotelId, status: "ready" }
      : { hotelId, status: "ready" };

    // Prepare update object - only include statusUpdatedBy if it's a valid ObjectId
    const updateObj = { 
      status: "checkout_pending", 
      statusUpdatedAt: new Date()
    };
    
    // Only add statusUpdatedBy if userId is a valid ObjectId format
    if (req.user.userId && mongoose.Types.ObjectId.isValid(req.user.userId)) {
      updateObj.statusUpdatedBy = req.user.userId;
    }

    const room = await Room.findOneAndUpdate(
      roomQuery,
      { $set: updateObj },
      { new: true }
    );

    if (!room) {
      return fail(res, "SOLD_OUT", roomId ? "This room is no longer available" : "Room just sold out", 409);
    }

    const booking = await Booking.create({
      guestId: req.user.userId,
      hotelId,
      roomId: room._id,
      checkInDate,
      checkOutDate,
      totalAmount,
      govtIdType,
      govtIdNumber,
      status: "confirmed",
      paymentStatus: "initiated"
    });

    const conversation = await Conversation.create({
      bookingId: booking._id,
      guestId: req.user.userId,
      hotelId
    });

    await Room.updateOne(
      { _id: room._id },
      {
        $set: {
          nextBookingId: booking._id,
          nextCheckInAt: new Date(checkInDate)
        }
      }
    );

    emitToBooking(booking._id, "BOOKING_CONFIRMED", {
      bookingId: booking._id,
      conversationId: conversation._id
    });

    return ok(res, { booking, conversation }, 201);
  } catch (err) {
    return next(err);
  }
});

router.get("/bookings/:bookingId", authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, guestId: req.user.userId });
    if (!booking) {
      return fail(res, "NOT_FOUND", "Booking not found", 404);
    }
    return ok(res, booking);
  } catch (err) {
    return next(err);
  }
});

export default router;
