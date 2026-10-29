import express from "express";
import cors from "cors";
import connectMongoDb from "./database/db.ts";
import { PORT } from "./config/config.ts";
import intersectionRoutes from "./routes/intersectionRoutes.ts";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Node.js + TypeScript server is running!");
});

app.use("/api/intersections", intersectionRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  },
);

const startServer = async () => {
  await connectMongoDb();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
