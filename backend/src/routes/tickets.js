import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Ticket } from "../models/Ticket.js";
import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { ok, fail } from "../utils/apiResponse.js";
import { emitToBooking, emitToHotelStaff } from "../socket/emitter.js";

const router = Router();

router.get("/staff/tickets", authenticate, async (req, res, next) => {
  try {
    const hotelId = req.query.hotelId;
    const query = hotelId ? { hotelId } : {};
    const tickets = await Ticket.find(query).sort({ createdAt: -1 }).limit(100);
    return ok(res, tickets);
  } catch (err) {
    return next(err);
  }
});

router.patch("/staff/tickets/:ticketId/resolve", authenticate, async (req, res, next) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.ticketId,
      { status: "resolved", resolvedAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return fail(res, "NOT_FOUND", "Ticket not found", 404);
    }

    emitToBooking(ticket.bookingId, "TICKET_UPDATED", {
      ticketId: ticket._id,
      status: ticket.status
    });

    return ok(res, ticket);
  } catch (err) {
    return next(err);
  }
});

export async function createEscalationTicket({ bookingId, summary, type = "front_desk", priority = "medium" }) {
  const booking = await Booking.findById(bookingId);
  const conversation = await Conversation.findOne({ bookingId });

  const ticket = await Ticket.create({
    hotelId: booking.hotelId,
    bookingId: booking._id,
    conversationId: conversation._id,
    guestId: booking.guestId,
    roomId: booking.roomId,
    type,
    summary,
    priority
  });

  emitToHotelStaff(booking.hotelId, "TICKET_CREATED", {
    ticketId: ticket._id,
    bookingId: booking._id,
    summary: ticket.summary,
    status: ticket.status
  });

  return ticket;
}

export default router;
