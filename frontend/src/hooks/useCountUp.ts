import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

/**
 * Animates a number from 0 to target when the element enters the viewport.
 * 1-3 increment quickly, 4-5 slow down, 6 slams down dramatically.
 */
export function useCountUp(
  target: number,
  options?: { duration?: number; delay?: number }
) {
  const { delay = 0 } = options ?? {};
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    // Per-step delays in ms: 1,2,3 are fast, 4,5 slow down, 6 slams
    const stepDelays: Record<number, number[]> = {
      6: [150, 150, 200, 500, 750, 1200],
    };
    const delays = stepDelays[target] ?? Array.from({ length: target }, (_, i) => {
      const frac = i / (target - 1);
      return 150 + frac * 750;
    });

    const timeout = setTimeout(() => {
      let currentStep = 0;

      const tick = () => {
        currentStep++;
        setValue(currentStep);

        if (currentStep < target) {
          setTimeout(tick, delays[currentStep]);
        } else {
          setDone(true);
        }
      };

      setTimeout(tick, delays[0]);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, target, delay]);

  return { ref, value, done };
}
