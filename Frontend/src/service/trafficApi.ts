import axios from "axios";
import { SignalTiming, TimingPlan } from "../types/types";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const trafficApi = {
  createIntersection: async (name: string, ways: number) => {
    const res = await api.post("/intersections", { name, ways });
    return res.data;
  },

  saveTimings: async (id: string, timings: SignalTiming[]) => {
    const res = await api.post(`/intersections/${id}/timings`, {
      timings,
    });
    return res.data as TimingPlan;
  },

  getTimings: async (id: string) => {
    const res = await api.get(`/intersections/${id}/timings`);
    return res.data as TimingPlan | null;
  },

  emergency: async (id: string, signalNumber: number) => {
    const res = await api.post(`/intersections/${id}/emergency`, {
      signalNumber,
    });
    return res.data;
  },
};
