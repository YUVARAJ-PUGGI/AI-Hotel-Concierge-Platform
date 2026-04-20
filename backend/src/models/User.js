import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["guest", "front_desk", "housekeeper", "manager", "admin"],
      default: "guest"
    }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
