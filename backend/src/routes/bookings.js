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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { hotelId, checkInDate, checkOutDate, totalAmount, govtIdType, govtIdNumber } = req.body;

    const room = await Room.findOneAndUpdate(
      { hotelId, status: "ready" },
      { $set: { status: "checkout_pending", statusUpdatedAt: new Date(), statusUpdatedBy: req.user.userId } },
      { new: true, session }
    );

    if (!room) {
      await session.abortTransaction();
      return fail(res, "SOLD_OUT", "Room just sold out", 409);
    }

    const booking = await Booking.create(
      [
        {
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
        }
      ],
      { session }
    );

    const conversation = await Conversation.create(
      [
        {
          bookingId: booking[0]._id,
          guestId: req.user.userId,
          hotelId
        }
      ],
      { session }
    );

    await Room.updateOne(
      { _id: room._id },
      {
        $set: {
          nextBookingId: booking[0]._id,
          nextCheckInAt: new Date(checkInDate)
        }
      },
      { session }
    );

    await session.commitTransaction();

    emitToBooking(booking[0]._id, "BOOKING_CONFIRMED", {
      bookingId: booking[0]._id,
      conversationId: conversation[0]._id
    });

    return ok(res, { booking: booking[0], conversation: conversation[0] }, 201);
  } catch (err) {
    await session.abortTransaction();
    return next(err);
  } finally {
    session.endSession();
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
