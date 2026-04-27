import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  mongoDbName: process.env.MONGODB_DB_NAME || "hotel",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS || 10000)
};
