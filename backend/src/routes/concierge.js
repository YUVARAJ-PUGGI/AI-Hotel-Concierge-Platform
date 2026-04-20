import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { Conversation } from "../models/Conversation.js";
import { Booking } from "../models/Booking.js";
import { Message } from "../models/Message.js";
import { Hotel } from "../models/Hotel.js";
import { HotelDocument } from "../models/HotelDocument.js";
import { config } from "../config.js";
import { postJsonWithTimeout } from "../utils/httpClient.js";
import { ok, fail } from "../utils/apiResponse.js";
import { emitToBooking, emitToHotelStaff } from "../socket/emitter.js";
import { createEscalationTicket } from "./tickets.js";

const router = Router();

async function nextSeq(conversationId) {
  const lastMessage = await Message.findOne({ conversationId }).sort({ seq: -1 }).lean();
  return lastMessage ? lastMessage.seq + 1 : 1;
}

router.post("/concierge/message", authenticate, async (req, res, next) => {
  try {
    const { bookingId, message } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, guestId: req.user.userId });
    if (!booking) {
      return fail(res, "FORBIDDEN", "Booking access denied", 403);
    }

    const conversation = await Conversation.findOne({ bookingId: booking._id });
    if (!conversation) {
      return fail(res, "NOT_FOUND", "Conversation not found", 404);
    }

    const seq = await nextSeq(conversation._id);
    await Message.create({
      conversationId: conversation._id,
      bookingId: booking._id,
      hotelId: booking.hotelId,
      sender: "guest",
      text: message,
      seq
    });

    emitToHotelStaff(booking.hotelId, "CONCIERGE_MESSAGE", {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      sender: "guest",
      text: message,
      seq
    });

    emitToBooking(booking._id, "CONCIERGE_TYPING", { typing: true });

    const hotel = await Hotel.findById(booking.hotelId).lean();
    const hotelDocuments = await HotelDocument.find({ hotelId: booking.hotelId }).sort({ createdAt: -1 }).limit(20).lean();
    const contexts = [
      hotel ? `Hotel summary: ${hotel.name}. ${hotel.description || ""} ${hotel.locationText}. Amenities: ${(hotel.amenities || []).join(", ")}` : "",
      ...hotelDocuments.map((document) => `${document.title}: ${document.content}`)
    ].filter(Boolean);

    let aiResponse;
    try {
      aiResponse = await postJsonWithTimeout(`${config.aiServiceUrl}/chat`, {
        bookingId: String(booking._id),
        hotelId: String(booking.hotelId),
        message,
        contexts
      }, config.aiTimeoutMs);
    } catch {
      aiResponse = {
        answer: "I do not have that information right now. I will connect you with the front desk.",
        escalate: true,
        reason: "ai_timeout"
      };
    }

    const assistantSeq = seq + 1;
    await Message.create({
      conversationId: conversation._id,
      bookingId: booking._id,
      hotelId: booking.hotelId,
      sender: "assistant",
      text: aiResponse.answer,
      seq: assistantSeq
    });

    if (aiResponse.escalate) {
      await createEscalationTicket({
        bookingId: booking._id,
        summary: `Escalated from concierge: ${message}`,
        type: aiResponse.reason === "unknown_fact" ? "unknown_fact" : "front_desk",
        priority: "high"
      });
    }

    emitToBooking(booking._id, "CONCIERGE_TYPING", { typing: false });
    emitToBooking(booking._id, "MESSAGE_RECEIVED", {
      sender: "assistant",
      text: aiResponse.answer,
      seq: assistantSeq,
      escalated: Boolean(aiResponse.escalate)
    });

    emitToHotelStaff(booking.hotelId, "CONCIERGE_MESSAGE", {
      bookingId: booking._id,
      hotelId: booking.hotelId,
      sender: "assistant",
      text: aiResponse.answer,
      seq: assistantSeq,
      escalated: Boolean(aiResponse.escalate)
    });

    return ok(res, {
      text: aiResponse.answer,
      escalated: Boolean(aiResponse.escalate)
    });
  } catch (err) {
    return next(err);
  }
});

router.get("/concierge/history/:bookingId", authenticate, async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, guestId: req.user.userId });
    if (!booking) {
      return fail(res, "FORBIDDEN", "Booking access denied", 403);
    }

    const conversation = await Conversation.findOne({ bookingId: booking._id });
    const messages = await Message.find({ conversationId: conversation._id }).sort({ seq: 1 }).limit(200);
    return ok(res, messages);
  } catch (err) {
    return next(err);
  }
});

export default router;
