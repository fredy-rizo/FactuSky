import mongoose from "mongoose";
const { Schema } = mongoose;

const moduleSchema = new Schema(
  {
    code: {
      type: String,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "core",
        "restaurant",
        "hotel",
        "veterinary",
        "barbershop",
        "carwash",
        "pharmacy",
        "store",
        "other",
      ],
      default: "core",
    },
    dependencies: [
      {
        type: String,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Module = mongoose.model("modules", moduleSchema);
