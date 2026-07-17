import { useEffect, useState } from "react";
import { Plane } from "lucide-react";

const STOPS = [
  { id: "section-personal", label: "Personal" },
  { id: "section-goal", label: "Goal" },
  { id: "section-documents", label: "Documents" },
];

export default function FlightPath() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const elements = STOPS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    if (elements.length !== STOPS.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const idx = elements.indexOf(mostVisible.target as HTMLElement);
          if (idx !== -1) setActive(idx);
        }
      },
      { rootMargin: "-15% 0px -60% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="pointer-events-none fixed left-10 top-1/2 z-10 hidden -translate-y-1/2 xl:block" aria-hidden="true">
      <div className="relative h-56 w-px">
        <div className="absolute inset-0 border-l-2 border-dotted border-study/25" />
        {STOPS.map((s, i) => (
          <div
            key={s.id}
            className="absolute left-0 flex -translate-x-1/2 -translate-y-1/2 items-center"
            style={{ top: `${(i / (STOPS.length - 1)) * 100}%` }}
          >
            <span
              className={`block h-2.5 w-2.5 rounded-full border-2 bg-surface transition-colors duration-300 ${
                i <= active ? "border-study" : "border-line"
              }`}
            />
            <span
              className={`ml-3 whitespace-nowrap text-[10px] font-bold uppercase tracking-wide transition-colors duration-300 ${
                i <= active ? "text-study" : "text-ink-mute/50"
              }`}
            >
              {s.label}
            </span>
          </div>
        ))}
        <div
          className="absolute left-0 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ top: `${(active / (STOPS.length - 1)) * 100}%` }}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-study text-white shadow-lg shadow-study/30">
            <Plane className="h-4 w-4 rotate-[-45deg]" />
          </span>
        </div>
      </div>
    </div>
  );
}
