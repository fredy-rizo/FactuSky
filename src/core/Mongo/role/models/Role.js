import mongoose from "mongoose";
const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "companies",
    },
    name: {
      type: String,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    access: {
      type: Map,
      of: [String],
      default: {},
    },
    active: { type: Boolean, default: true },
    system: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

roleSchema.index({
  company: 1,
  code: 1,
});

export const Role = mongoose.model("roles", roleSchema);
