import { Schema, model } from "mongoose";

const signalTimingSchema = new Schema(
  {
    signalNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    greenSeconds: {
      type: Number,
      required: true,
      min: 0.1,
      max: 3600,
    },
  },
  { _id: false },
);

const timingPlanSchema = new Schema(
  {
    intersectionId: {
      type: Schema.Types.ObjectId,
      ref: "Intersection",
      required: true,
      index: true,
    },
    timings: {
      type: [signalTimingSchema],
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

timingPlanSchema.index({
  intersectionId: 1,
  active: 1,
});

export default model("TimingPlan", timingPlanSchema);
