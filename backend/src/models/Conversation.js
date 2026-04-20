import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    status: { type: String, enum: ["active", "closed"], default: "active" }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", ConversationSchema);
