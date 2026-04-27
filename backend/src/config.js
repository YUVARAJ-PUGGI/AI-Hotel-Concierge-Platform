import dotenv from "dotenv";

dotenv.config();

const defaultFrontendOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const rawFrontendOrigin = process.env.FRONTEND_ORIGIN || defaultFrontendOrigins.join(",");
const frontendOrigins = Array.from(
  new Set(
    rawFrontendOrigin
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
);

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  mongoDbName: process.env.MONGODB_DB_NAME || "hotel",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  frontendOrigin: frontendOrigins[0] || "http://localhost:5173",
  frontendOrigins,
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 10000)
};
