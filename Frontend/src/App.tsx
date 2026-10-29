import { useEffect, useState } from "react";
import TrafficLight from "./common/TrafficLight";
import EmergencyButton from "./common/EmergencyButton";
import type { Intersection, SignalColor, TimingPlan } from "./types/types";
import { api } from "./config/api";

const SIGNAL_LIMIT = 5;
const DEFAULT_INTERSECTION_NAME = "Main Junction";

const createEmptyTimes = () => Array<string>(SIGNAL_LIMIT).fill("");

const createRedSignals = (): SignalColor[] =>
  Array<SignalColor>(SIGNAL_LIMIT).fill("red");

const signalPositions = [
  "left-[36%] top-[25%]",
  "left-[56%] top-[25%]",
  "left-[36%] top-[64%]",
  "left-[56%] top-[60%]",
  "left-[14%] top-[78%]",
];

const emergencyPositions = [
  "left-6 top-6",
  "right-6 top-6",
  "bottom-7 left-6",
  "bottom-7 right-6",
  "left-1/2 top-6 -translate-x-1/2",
];

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

const getSignalColors = (activeIndex: number): SignalColor[] => {
  return Array.from({ length: SIGNAL_LIMIT }, (_, index) =>
    index === activeIndex ? "green" : "red",
  );
};

const App = () => {
  const [ways, setWays] = useState("5");
  const [showModal, setShowModal] = useState(false);
  const [times, setTimes] = useState<string[]>(createEmptyTimes);
  const [saved, setSaved] = useState(false);
  const [signals, setSignals] = useState<SignalColor[]>(createRedSignals);

  const [intersectionId, setIntersectionId] = useState("");
  const [intersectionName, setIntersectionName] = useState(
    DEFAULT_INTERSECTION_NAME,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const signalCount = Number(ways);

  const createIntersection = async (): Promise<string> => {
    if (intersectionId) {
      return intersectionId;
    }

    const intersection = await api<Intersection>("/intersections", {
      method: "POST",
      body: JSON.stringify({
        name: intersectionName.trim(),
        ways: signalCount,
      }),
    });

    setIntersectionId(intersection._id);
    return intersection._id;
  };

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const intersections = await api<Intersection[]>("/intersections");

        if (cancelled || intersections.length === 0) {
          return;
        }

        const selected = intersections[0];

        setIntersectionId(selected._id);
        setIntersectionName(selected.name);
        setWays(String(selected.ways));

        const plan = await api<TimingPlan | null>(
          `/intersections/${selected._id}/timings`,
        );

        if (cancelled || !plan) {
          return;
        }

        const nextTimes = createEmptyTimes();

        plan.timings.forEach(({ signalNumber, greenSeconds }) => {
          nextTimes[signalNumber - 1] = String(greenSeconds);
        });

        setTimes(nextTimes);
        setSaved(true);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Unable to load dashboard"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!saved) {
      return;
    }

    const durations = times.slice(0, signalCount).map(Number);
    const hasInvalidDuration = durations.some(
      (duration) => !Number.isFinite(duration) || duration <= 0,
    );

    if (durations.length !== signalCount || hasInvalidDuration) {
      return;
    }

    let currentSignal = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const activateNextSignal = () => {
      const signalIndex = currentSignal;

      setSignals(getSignalColors(signalIndex));

      timeoutId = setTimeout(() => {
        currentSignal = (currentSignal + 1) % signalCount;
        activateNextSignal();
      }, durations[signalIndex] * 1000);
    };

    activateNextSignal();

    return () => clearTimeout(timeoutId);
  }, [saved, times, signalCount]);

  const saveTimes = async () => {
    const selectedTimes = times.slice(0, signalCount);

    const hasInvalidTime = selectedTimes.some(
      (time) =>
        !time.trim() || !Number.isFinite(Number(time)) || Number(time) <= 0,
    );

    if (!intersectionName.trim()) {
      setError("Please enter the intersection name.");
      return;
    }

    if (hasInvalidTime) {
      setError(`Enter a valid time for all ${signalCount} signals.`);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const id = await createIntersection();

      await api<TimingPlan>(`/intersections/${id}/timings`, {
        method: "POST",
        body: JSON.stringify({
          timings: selectedTimes.map((time, index) => ({
            signalNumber: index + 1,
            greenSeconds: Number(time),
          })),
        }),
      });

      setSignals(createRedSignals());
      setSaved(true);
      setShowModal(false);
      setNotice("Signal timings saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save timings"));
    } finally {
      setLoading(false);
    }
  };

  const handleEmergency = async (index: number) => {
    if (index >= signalCount || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const id = await createIntersection();

      await api(`/intersections/${id}/emergency`, {
        method: "POST",
        body: JSON.stringify({
          signalNumber: index + 1,
        }),
      });

      setSaved(false);
      setSignals(getSignalColors(index));
      setNotice(`Emergency mode active for 30 seconds (Signal ${index + 1}).`);

      setTimeout(() => {
        setSignals(createRedSignals());
        setSaved(true);
        setNotice("Emergency mode ended. Normal traffic resumed.");
      }, 30000);
    } catch (err) {
      setError(getErrorMessage(err, "Emergency request failed"));
    } finally {
      setLoading(false);
    }
  };

  const resetDashboard = async () => {
    setSaved(false);
    setTimes(createEmptyTimes());
    setSignals(createRedSignals());
    setShowModal(false);
    setError("");
    setNotice("");

    if (!intersectionId) {
      return;
    }

    setLoading(true);

    try {
      await api(`/intersections/${intersectionId}/reset`, {
        method: "POST",
      });

      setNotice("Dashboard reset successfully.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Dashboard reset locally, but database reset failed",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleWaysChange = async (value: string) => {
    setWays(value);
    setIntersectionId("");
    setSaved(false);
    setTimes(createEmptyTimes());
    setSignals(createRedSignals());
    setNotice("");
    setError("");
  };

  const handleIntersectionNameChange = (value: string) => {
    setIntersectionName(value);
    setIntersectionId("");
  };

  return (
    <main className="min-h-screen bg-grey">
      <section className="relative mx-auto h-screen min-h-[650px] overflow-hidden bg-gray-100">
        <div className="absolute left-[48%] top-0 h-full w-[100px] -translate-x-1/2 bg-black">
          <div className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-dashed border-white/80" />
        </div>

        <div className="absolute left-0 top-[49%] h-[100px] w-full -translate-y-1/2 bg-black">
          <div className="absolute left-0 top-1/2 w-full -translate-y-1/2 border-t-2 border-dashed border-white/80" />
        </div>

        <div className="absolute left-[-11%] top-[90%] h-[100px] w-[65%] origin-left -rotate-[21.5deg] bg-black">
          <div className="absolute left-0 top-1/2 w-full -translate-y-1/2 border-t-2 border-dashed border-white/80" />
        </div>

        {Array.from({ length: signalCount }, (_, index) => (
          <div
            key={index}
            className={`absolute z-20 ${emergencyPositions[index]}`}
          >
            <EmergencyButton onClick={() => void handleEmergency(index)} />
          </div>
        ))}

        {Array.from({ length: signalCount }, (_, index) => (
          <div
            key={index}
            className={`absolute z-20 ${signalPositions[index]}`}
          >
            <TrafficLight active={signals[index]} />
          </div>
        ))}

        {showModal && (
          <div className="absolute left-1/2 top-1/2 z-40 max-h-[90%] w-72 -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
            <h2 className="mb-4 text-sm font-medium">
              {signalCount}-Way Signal Timing
            </h2>

            <div className="space-y-3">
              {times.slice(0, signalCount).map((time, index) => (
                <div key={index}>
                  <label
                    htmlFor={`signal-${index + 1}`}
                    className="mb-1 block text-xs"
                  >
                    Signal {index + 1} Time (seconds)
                  </label>

                  <input
                    id={`signal-${index + 1}`}
                    type="number"
                    min="0.1"
                    step="any"
                    value={time}
                    onChange={(event) => {
                      const value = event.target.value;

                      setTimes((currentTimes) =>
                        currentTimes.map((currentTime, timeIndex) =>
                          timeIndex === index ? value : currentTime,
                        ),
                      );
                    }}
                    placeholder="Enter time in seconds"
                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => void saveTimes()}
              className="mt-4 h-10 w-full rounded-md bg-teal-700 text-sm text-white hover:bg-teal-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-2 h-10 w-full rounded-md border border-gray-300 text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="absolute bottom-7 left-1/2 z-50 flex w-11/12 max-w-xl -translate-x-1/2 flex-col gap-3 rounded-xl bg-white p-4 shadow-lg sm:flex-row sm:items-center">
          <input
            value={intersectionName}
            onChange={(event) =>
              handleIntersectionNameChange(event.target.value)
            }
            placeholder="Intersection name"
            className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 px-3 text-sm"
          />

          <select
            value={ways}
            onChange={(event) => handleWaysChange(event.target.value)}
            className="h-10 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="2">2 Ways</option>
            <option value="3">3 Ways</option>
            <option value="4">4 Ways</option>
            <option value="5">5 Ways</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
            className="h-10 rounded-md bg-teal-700 px-5 text-sm text-white hover:bg-teal-800"
          >
            Set Time
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void resetDashboard()}
            className="h-10 rounded-md border border-gray-300 px-5 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        <div className="absolute left-3 top-24 z-30 max-w-[90%] space-y-1 text-sm">
          {loading && <p className="text-gray-600">Processing...</p>}

          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}

          {notice && <p className="text-teal-700">{notice}</p>}

          {saved && <p className="text-teal-700">Timings saved</p>}
        </div>
      </section>
    </main>
  );
};

export default App;
