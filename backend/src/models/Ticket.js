import mongoose from "mongoose";

const TicketSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    type: {
      type: String,
      enum: ["complaint", "room_service", "front_desk", "unknown_fact"],
      default: "front_desk"
    },
    summary: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    resolvedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const Ticket = mongoose.model("Ticket", TicketSchema);
