import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDb } from "./utils/db.js";
import { logger } from "./utils/logger.js";
import { registerSocket } from "./socket/registerSocket.js";
import { setIo } from "./socket/emitter.js";
import { Hotel } from "./models/Hotel.js";
import { Room } from "./models/Room.js";

async function seedIfEmpty() {
  const hotelCount = await Hotel.countDocuments();
  if (hotelCount > 0) return;

  const demoHotels = await Hotel.insertMany([
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

  const rooms = [];
  demoHotels.forEach((hotel, index) => {
    rooms.push(
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

  await Room.insertMany(rooms);
}

async function bootstrap() {
  await connectDb();
  await seedIfEmpty();

  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.frontendOrigin
    }
  });

  setIo(io);
  registerSocket(io);

  server.listen(config.port, () => {
    logger.info(`Backend listening on port ${config.port}`);
  });
}

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
