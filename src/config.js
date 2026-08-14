import { config } from "dotenv";
config();
export default {
  PORT: process.env.PORT || "",
  SECRET: process.env.SECRET || "contra, token",
  MONGODB_URL: process.env.MONGODB_URL || "",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  DB_HOST: process.env.DB_HOST || "",
  DB_USER: process.env.DB_USER || "",
  DB_NAME: process.env.DB_NAME || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
};
