import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.js";
import hotelRoutes from "./routes/hotels.js";
import bookingRoutes from "./routes/bookings.js";
import conciergeRoutes from "./routes/concierge.js";
import ticketRoutes from "./routes/tickets.js";
import devRoutes from "./routes/dev.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { config } from "./config.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.frontendOrigin }));
  app.use(express.json({ limit: "2mb" }));

  app.use("/api", healthRoutes);
  app.use("/api", devRoutes);
  app.use("/api", hotelRoutes);
  app.use("/api", bookingRoutes);
  app.use("/api", conciergeRoutes);
  app.use("/api", ticketRoutes);
  app.use("/api", adminRoutes);
  app.use("/api", authRoutes);

  app.use(errorHandler);

  return app;
}
