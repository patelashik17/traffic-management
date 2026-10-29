import mongoose from "mongoose";
import { MONGO_URL } from "../config/config.ts";

const connectMongoDb = async () => {
  try {
    await mongoose.connect(MONGO_URL || "");
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.log("Error in mongo db connection", error);
  }
};

export default connectMongoDb;
