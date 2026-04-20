import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    sender: { type: String, enum: ["guest", "assistant", "staff"], required: true },
    text: { type: String, required: true },
    seq: { type: Number, required: true }
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, seq: 1 }, { unique: true });

export const Message = mongoose.model("Message", MessageSchema);
