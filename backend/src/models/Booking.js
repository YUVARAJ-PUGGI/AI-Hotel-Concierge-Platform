import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    guestId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["initiated", "confirmed", "checked_in", "checked_out", "cancelled"],
      default: "initiated"
    },
    paymentStatus: {
      type: String,
      enum: ["initiated", "pending", "completed", "failed", "refunded"],
      default: "initiated"
    },
    totalAmount: { type: Number, required: true },
    govtIdType: { type: String, default: "" },
    govtIdNumber: { type: String, default: "" },
    govtIdUrl: { type: String, default: "" }
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", BookingSchema);
