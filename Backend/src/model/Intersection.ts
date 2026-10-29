import { Schema, model } from "mongoose";

const intersectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ways: {
      type: Number,
      required: true,
      min: 2,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Ways must be an integer",
      },
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default model("Intersection", intersectionSchema);
