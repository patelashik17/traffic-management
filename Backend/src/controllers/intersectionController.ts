import type { Request, Response } from "express";
import Intersection from "../model/Intersection.ts";
import TimingPlan from "../model/TimingPlan.ts";
import {
  createSchema,
  emergencySchema,
  idSchema,
  timingSchema,
} from "../validation/validation.ts";

const parseId = (value: string): string | null => {
  return idSchema.safeParse(value).success ? value : null;
};

export const createIntersection = async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid intersection details",
      errors: parsed.error.flatten(),
    });
  }

  const intersection = await Intersection.create(parsed.data);
  return res.status(201).json(intersection);
};

export const listIntersections = async (_req: Request, res: Response) => {
  const intersections = await Intersection.find().sort({
    createdAt: -1,
  });

  return res.json(intersections);
};

export const getTimings = async (req: Request | any, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const intersection = await Intersection.findById(id);
  if (!intersection) {
    return res.status(404).json({
      message: "Intersection not found",
    });
  }

  const plan = await TimingPlan.findOne({
    intersectionId: intersection._id,
    active: true,
  });

  return res.json(plan);
};

export const saveTimings = async (req: Request | any, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const parsed = timingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid timing configuration",
      errors: parsed.error.flatten(),
    });
  }

  const intersection = await Intersection.findById(id);
  if (!intersection) {
    return res.status(404).json({
      message: "Intersection not found",
    });
  }

  const { timings } = parsed.data;
  const expected = intersection.ways;

  const numbers = timings.map((item) => item.signalNumber);
  const validNumbers =
    timings.length === expected &&
    new Set(numbers).size === expected &&
    numbers.every((n) => n >= 1 && n <= expected) &&
    Array.from({ length: expected }, (_, i) => i + 1).every((n) =>
      numbers.includes(n),
    );

  if (!validNumbers) {
    return res.status(400).json({
      message: `Provide exactly one timing for each of the ${expected} signals`,
    });
  }

  const plan = await TimingPlan.create({
    intersectionId: intersection._id,
    timings,
    active: false,
  });

  await TimingPlan.updateMany(
    { intersectionId: intersection._id },
    { $set: { active: false } },
  );

  plan.active = true;
  await plan.save();

  return res.status(201).json(plan);
};

export const emergency = async (req: any, res: Response) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const parsed = emergencySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid emergency request",
    });
  }

  const intersection = await Intersection.findById(id);

  if (!intersection) {
    return res.status(404).json({
      message: "Intersection not found",
    });
  }

  if (parsed.data.signalNumber > intersection.ways) {
    return res.status(400).json({
      message: "Signal does not belong to this intersection",
    });
  }

  return res.status(200).json({
    message: "Emergency request processed successfully",
    data: {
      intersectionId: id,
      signalNumber: parsed.data.signalNumber,
      details: parsed.data.details ?? "",
    },
  });
};

export const resetIntersection = async (req: Request | any, res: Response) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  const intersection = await Intersection.findById(id);

  if (!intersection) {
    return res.status(404).json({
      message: "Intersection not found",
    });
  }

  await TimingPlan.updateMany(
    { intersectionId: intersection._id },
    { $set: { active: false } },
  );

  return res.status(200).json({
    message: "Intersection reset successfully",
    intersectionId: intersection._id,
  });
};
