import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    token: { type: String, default: "" },
    first_name: { type: String, trim: true },
    last_name: { type: String, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, default: "-------------" },
    password: { type: String, trim: true },
    active: { type: String, default: true },
    role: {
      type: String,
      enum: ["super admin", "admin", "developer"],
      default: "admin",
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

export const encrypt_password = async (password) => {
  const pass = password.toString();
  return await bcrypt.hash(pass, 12);
};

export const compare_password = async (password, received_password) => {
  return await bcrypt.compare(password, received_password);
};

export const User = mongoose.model("users", userSchema);

// Modelo para creacion de usuarios propios de la empresa
