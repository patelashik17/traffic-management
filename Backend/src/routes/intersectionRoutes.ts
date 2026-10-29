import { Router } from "express";
import {
  createIntersection,
  listIntersections,
  getTimings,
  saveTimings,
  emergency,
} from "../controllers/intersectionController.ts";

const intersectionRoutes = Router();

intersectionRoutes.post("/", createIntersection);
intersectionRoutes.get("/", listIntersections);
intersectionRoutes.get("/:id/timings", getTimings);
intersectionRoutes.post("/:id/timings", saveTimings);
intersectionRoutes.post("/:id/emergency", emergency);

export default intersectionRoutes;
