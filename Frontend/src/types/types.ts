export type SignalColor = "green" | "yellow" | "red";

export type Intersection = {
  _id: string;
  name: string;
  ways: number;
};

export type Timing = {
  signalNumber: number;
  greenSeconds: number;
};

export type TimingPlan = {
  _id: string;
  intersectionId: string;
  timings: Timing[];
  active: boolean;
};

export interface SignalTiming {
  signalNumber: number;
  greenSeconds: number;
}
