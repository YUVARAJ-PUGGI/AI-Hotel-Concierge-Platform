import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["occupied", "checkout_pending", "dirty", "in_progress", "inspecting", "ready"],
      default: "ready"
    },
    statusUpdatedAt: { type: Date, default: Date.now },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    nextBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    nextCheckInAt: { type: Date, default: null },
    estimatedReadyAt: { type: Date, default: null },
    housekeeper: {
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      startedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      notes: { type: String, default: "" }
    },
    amenities: [{ type: String }],
    maxOccupancy: { type: Number, default: 2 }
  },
  { timestamps: true }
);

RoomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model("Room", RoomSchema);
