import { SignalColor } from "../types/types";

const TrafficLight = ({ active }: { active: SignalColor }) => {
  const lights: { color: SignalColor; bg: string }[] = [
    { color: "green", bg: "bg-[#00c94b]" },
    { color: "yellow", bg: "bg-[#e6a000]" },
    { color: "red", bg: "bg-[#f0353b]" },
  ];

  return (
    <div className="flex h-[115px] w-[70px] shrink-0 flex-col items-center justify-center gap-[7px] rounded-[17px] bg-[#222] shadow-sm">
      {lights.map((light) => (
        <div
          key={light.color}
          className={`h-[29px] w-[29px] rounded-full ${light.bg} ${
            active === light.color ? "ring-2 ring-white/40" : "opacity-30"
          }`}
        />
      ))}
    </div>
  );
};

export default TrafficLight;
