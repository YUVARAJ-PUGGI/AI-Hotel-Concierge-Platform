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
    // Staff can only see tickets for their own hotel
    if (!req.user.hotelId) {
      return fail(res, "FORBIDDEN", "Staff must be assigned to a hotel", 403);
    }

    const tickets = await Ticket.find({ hotelId: req.user.hotelId })
      .populate('bookingId', 'guestId roomId checkInDate checkOutDate')
      .populate('guestId', 'name email')
      .populate('roomId', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(100);
    
    return ok(res, tickets);
  } catch (err) {
    return next(err);
  }
});

router.patch("/staff/tickets/:ticketId/resolve", authenticate, async (req, res, next) => {
  try {
    // Staff can only update tickets for their own hotel
    if (!req.user.hotelId) {
      return fail(res, "FORBIDDEN", "Staff must be assigned to a hotel", 403);
    }

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return fail(res, "NOT_FOUND", "Ticket not found", 404);
    }

    // Verify staff is updating ticket for their hotel
    if (ticket.hotelId.toString() !== req.user.hotelId) {
      return fail(res, "FORBIDDEN", "You can only update tickets for your hotel", 403);
    }

    const { status = "resolved" } = req.body;

    if (!["in_progress", "resolved"].includes(status)) {
      return fail(res, "VALIDATION_ERROR", "Invalid status. Use 'in_progress' or 'resolved'", 400);
    }

    ticket.status = status;
    if (status === "resolved") {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

    emitToBooking(ticket.bookingId, "TICKET_UPDATED", {
      ticketId: ticket._id,
      status: ticket.status
    });

    return ok(res, ticket);
  } catch (err) {
    return next(err);
  }
});

router.patch("/staff/tickets/:ticketId/status", authenticate, async (req, res, next) => {
  try {
    // Staff can update ticket status (open, in_progress, resolved)
    if (!req.user.hotelId) {
      return fail(res, "FORBIDDEN", "Staff must be assigned to a hotel", 403);
    }

    const { status } = req.body;

    if (!["open", "in_progress", "resolved"].includes(status)) {
      return fail(res, "VALIDATION_ERROR", "Invalid status", 400);
    }

    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return fail(res, "NOT_FOUND", "Ticket not found", 404);
    }

    // Verify staff is updating ticket for their hotel
    if (ticket.hotelId.toString() !== req.user.hotelId) {
      return fail(res, "FORBIDDEN", "You can only update tickets for your hotel", 403);
    }

    ticket.status = status;
    if (status === "resolved") {
      ticket.resolvedAt = new Date();
    }
    await ticket.save();

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
