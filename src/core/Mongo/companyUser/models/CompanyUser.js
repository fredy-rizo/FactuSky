import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema } = mongoose;

const companyUserSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "roles",
    },
    // Informacion personal
    first_name: {
      type: String,
      trim: true,
    },
    last_name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    document_type: {
      type: String,
      enum: ["CC", "CE", "PASSPORT", "OTHER"],
      default: "CC",
    },
    // Autenticacion
    document_number: {
      type: String,
      default: "",
      trim: true,
    },
    password: {
      type: String,
    },
    token: { type: String, default: "" },
    // Estado
    active: { type: Boolean, default: false },
    // Primer inicio de sesion
    password_changed: {
      type: Boolean,
      default: false,
    },
    // Primer inicio de sesion
    last_login: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

companyUserSchema.index({
  company: 1,
  email: 1,
});

companyUserSchema.index(
  {
    company: 1,
    document_number: 1,
  },
  {
    sparse: 1,
  },
);

export const encrypt_password = async (password) => {
  return await bcrypt.hash(password.toString(), 12);
};

export const compare_password = async (password, received_password) => {
  return await bcrypt.compare(password, received_password);
};

export const CompanyUser = mongoose.model("company_users", companyUserSchema);
