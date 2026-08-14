import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema(
  {
    // Informacion empresa
    name: { type: String, trim: true },
    trade_name: { type: String, default: "", trim: true },
    document_type: {
      type: String,
      enum: ["NIT", "CC", "CE", "PASSPORT", "OTHER"],
      default: "NIT",
    },
    document_number: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    country: { type: String, default: "Colombia", trim: true },
    phone: { type: String, default: "", trim: true },

    // Informacion negocio
    business_type: {
      type: String,
      enum: [
        "store",
        "restaurant",
        "hotel",
        "veterinary",
        "barbershop",
        "carwash",
        "pharmacy",
        "other",
      ],
      default: "other",
    },

    // Plan
    plan: { type: Schema.Types.ObjectId, ref: "plans", default: null },

    // Modulos de empresa
    modules: [
      {
        module: {
          type: Schema.Types.ObjectId,
          ref: "modules",
        },
        active: {
          type: Boolean,
          default: true,
        },
        code: {
          type: String,
          trim: true,
          lowercase: true,
        },
        name: {
          type: String,
          trim: true,
        },
        activated_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Estado
    active: { type: Boolean, default: true },

    // Fecha de suscripcion
    subscription_start: { type: Date, default: null },
    subscription_end: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Company = mongoose.model("companies", companySchema);
