import mongoose from "mongoose";
const { Schema } = mongoose;

const planSchema = new Schema(
  {
    code: {
      type: String,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: "COP",
      uppercase: true,
      trim: true,
    },
    billing_cycle: {
      type: String,
      enum: ["monthly", "yearly", "one_time"],
      default: "monthly",
    },
    modules: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    max_users: {
      type: Number,
      default: 1,
      min: 1,
    },
    max_companies: {
      type: Number,
      default: 0,
      min: 0,
    },
    trial_days: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    popular: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Plan = mongoose.model("plans", planSchema);
