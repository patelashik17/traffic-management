import { z } from "zod";
import mongoose from "mongoose";

export const idSchema = z
  .string()
  .refine(
    (value) => mongoose.isValidObjectId(value),
    "Invalid intersection ID",
  );

export const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  ways: z.number().int().min(2).max(5),
});

export const timingSchema = z.object({
  timings: z
    .array(
      z.object({
        signalNumber: z.number().int().min(1).max(5),
        greenSeconds: z.number().min(0.1).max(3600),
      }),
    )
    .min(2)
    .max(5),
});

export const emergencySchema = z.object({
  signalNumber: z.number().int().min(1).max(5),
  details: z.string().max(500).optional(),
});
