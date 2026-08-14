import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DB_URI = process.env.MONGODB_URL;
if (!DB_URI) {
  throw new Error("MONGODB_URL environment variable is not defined");
}

mongoose.set("strictQuery", true);

export const MongoDB = () => {
  mongoose
    .connect(DB_URI, {})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error connected", err));
};
