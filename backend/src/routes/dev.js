import { Router } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { Hotel } from "../models/Hotel.js";
import { Room } from "../models/Room.js";
import { ok } from "../utils/apiResponse.js";

const router = Router();

async function seedDemoData() {
  const hotelCount = await Hotel.countDocuments();
  if (hotelCount > 0) return { seeded: false };

  const hotels = await Hotel.insertMany([
    {
      name: "Aster Court Hotel",
      description: "Modern business hotel near the city center.",
      locationText: "Koramangala, Bengaluru",
      startingPrice: 2899,
      photoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      rating: 4.6,
      amenities: ["Breakfast", "Wi-Fi", "Parking", "Gym"],
      geo: { type: "Point", coordinates: [77.6205, 12.9352] }
    },
    {
      name: "Palm View Suites",
      description: "Quiet stay with great room service and family rooms.",
      locationText: "Indiranagar, Bengaluru",
      startingPrice: 3499,
      photoUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
      rating: 4.4,
      amenities: ["Breakfast", "Pool", "Room Service", "Laundry"],
      geo: { type: "Point", coordinates: [77.6408, 12.9784] }
    },
    {
      name: "Metro Luxe Inn",
      description: "Compact premium hotel for business and quick stays.",
      locationText: "MG Road, Bengaluru",
      startingPrice: 3199,
      photoUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      rating: 4.5,
      amenities: ["Wi-Fi", "Late Checkout", "Restaurant", "Cab"],
      geo: { type: "Point", coordinates: [77.6087, 12.9753] }
    }
  ]);

  const roomDocs = [];
  hotels.forEach((hotel, index) => {
    roomDocs.push(
      {
        hotelId: hotel._id,
        roomNumber: `${index + 1}01`,
        floor: 1,
        type: "deluxe_double",
        status: "ready",
        maxOccupancy: 2,
        amenities: ["AC", "Wi-Fi", "TV"],
        statusUpdatedAt: new Date()
      },
      {
        hotelId: hotel._id,
        roomNumber: `${index + 1}02`,
        floor: 1,
        type: "premium_suite",
        status: "ready",
        maxOccupancy: 3,
        amenities: ["AC", "Wi-Fi", "Mini Bar"],
        statusUpdatedAt: new Date()
      }
    );
  });

  await Room.insertMany(roomDocs);
  return { seeded: true, hotels: hotels.length, rooms: roomDocs.length };
}

router.get("/dev/session", (req, res) => {
  const role = req.query.role || "guest";
  const payload = {
    userId: `demo-${role}`,
    role,
    name: role === "guest" ? "Demo Guest" : "Demo Staff",
    email: `${role}@demo.local`
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
  return ok(res, { token, user: payload });
});

router.post("/dev/seed-demo-data", async (req, res, next) => {
  try {
    const result = await seedDemoData();
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
});

router.get("/dev/seed-demo-data", async (req, res, next) => {
  try {
    const result = await seedDemoData();
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
});

export default router;