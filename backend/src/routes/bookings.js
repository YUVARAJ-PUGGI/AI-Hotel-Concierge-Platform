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
  let session = null;
  // Using transactions requires a replica set. Default to no-transaction mode for local dev.
  let useTransaction = false;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    // Transactions may not be supported on standalone MongoDB instances. Fall back.
    useTransaction = false;
    if (session) {
      try {
        session.endSession();
      } catch {}
      session = null;
    }
  }

  try {
    if (!mongoose.isValidObjectId(req.user.userId)) {
      if (useTransaction && session) await session.abortTransaction();
      return fail(res, "UNAUTHORIZED", "Invalid session user", 401);
    }

    const { hotelId, roomId, checkInDate, checkOutDate, totalAmount, govtIdType, govtIdNumber } = req.body;

    const roomQuery = { hotelId, status: "ready" };
    if (roomId && mongoose.isValidObjectId(roomId)) {
      roomQuery._id = roomId;
    }

    const roomUpdate = {
      status: "checkout_pending",
      statusUpdatedAt: new Date(),
      statusUpdatedBy: req.user.userId
    };

    const findOneAndUpdateOptions = { new: true };
    if (useTransaction && session) findOneAndUpdateOptions.session = session;
    const room = await Room.findOneAndUpdate(roomQuery, { $set: roomUpdate }, findOneAndUpdateOptions);

    if (!room) {
      await session.abortTransaction();
      return fail(res, "SOLD_OUT", "Room just sold out", 409);
    }

    const bookingDoc = {
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
    };

    let booking;
    if (useTransaction && session) {
      booking = await Booking.create([bookingDoc], { session });
    } else {
      booking = await Booking.create([bookingDoc]);
    }

    const conversationDoc = {
      bookingId: booking[0]._id,
      guestId: req.user.userId,
      hotelId
    };
    let conversation;
    if (useTransaction && session) {
      conversation = await Conversation.create([conversationDoc], { session });
    } else {
      conversation = await Conversation.create([conversationDoc]);
    }

    const roomUpdatePayload = {
      $set: {
        nextBookingId: booking[0]._id,
        nextCheckInAt: new Date(checkInDate)
      }
    };
    const roomUpdateOptions = {};
    if (useTransaction && session) roomUpdateOptions.session = session;
    await Room.updateOne({ _id: room._id }, roomUpdatePayload, roomUpdateOptions);

    if (useTransaction && session) await session.commitTransaction();

    emitToBooking(booking[0]._id, "BOOKING_CONFIRMED", {
      bookingId: booking[0]._id,
      conversationId: conversation[0]._id
    });

    return ok(res, { booking: booking[0], conversation: conversation[0] }, 201);
  } catch (err) {
    if (useTransaction && session) await session.abortTransaction();
    return next(err);
  } finally {
    if (session) session.endSession();
  }
});

router.get("/bookings/:bookingId", authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, guestId: req.user.userId })
      .populate("hotelId", "name locationText photoUrl")
      .populate("roomId", "roomNumber type price")
      .lean();
    if (!booking) {
      return fail(res, "NOT_FOUND", "Booking not found", 404);
    }
    return ok(res, booking);
  } catch (err) {
    return next(err);
  }
});

router.get("/bookings", authenticate, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ guestId: req.user.userId })
      .populate("hotelId", "name locationText photoUrl")
      .populate("roomId", "roomNumber type")
      .sort({ createdAt: -1 })
      .lean();

    return ok(res, bookings);
  } catch (err) {
    return next(err);
  }
});

export default router;
