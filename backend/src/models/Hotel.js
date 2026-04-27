import mongoose from "mongoose";

const HotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    locationText: { type: String, required: true },
    startingPrice: { type: Number, default: 2500 },
    photoUrl: { type: String, default: "" },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    rating: { type: Number, default: 4.0 },
    amenities: [{ type: String }],
    staff: [
      {
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        role: { 
          type: String, 
          enum: ["front_desk", "housekeeper", "manager"],
          default: "front_desk"
        },
        addedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

HotelSchema.index({ geo: "2dsphere" });

export const Hotel = mongoose.model("Hotel", HotelSchema);
