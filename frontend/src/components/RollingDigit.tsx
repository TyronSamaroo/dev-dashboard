import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

/**
 * Slot-machine style rolling digit counter.
 * Digits scroll vertically from 0 to the target number, then slam into place.
 */
export function RollingCounter({
  value,
  suffix = "",
  delay = 0,
}: {
  value: number;
  suffix?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!inView || hasTriggered.current) return;
    hasTriggered.current = true;

    const timeout = setTimeout(() => {
      setRolling(true);
      // Total roll duration matches CSS transition (3.5s roll + buffer)
      setTimeout(() => setLanded(true), 3800);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, delay]);

  return (
    <span ref={ref} className="rolling-counter">
      <span className="rolling-digit-wrapper">
        <span
          className={`rolling-digit-strip ${rolling ? "rolling" : ""} ${landed ? "landed" : ""}`}
          style={{
            "--target": value,
          } as React.CSSProperties}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="rolling-digit-cell" aria-hidden={i !== value}>
              {i}
            </span>
          ))}
        </span>
      </span>
      {suffix && <span className={`rolling-suffix ${landed ? "suffix-visible" : ""}`}>{suffix}</span>}
    </span>
  );
}
