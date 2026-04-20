import mongoose from "mongoose";

const HotelDocumentSchema = new mongoose.Schema(
  {
    hotelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true, index: true },
    title: { type: String, required: true },
    sourceName: { type: String, default: "manual upload" },
    content: { type: String, required: true },
    tags: [{ type: String }],
    createdBy: { type: String, default: null }
  },
  { timestamps: true }
);

HotelDocumentSchema.index({ hotelId: 1, createdAt: -1 });

export const HotelDocument = mongoose.model("HotelDocument", HotelDocumentSchema);