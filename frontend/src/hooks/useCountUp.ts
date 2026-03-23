import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

/**
 * Animates a number from 0 to target with variable speed:
 * fast at first, decelerating before the final "slam" number.
 * Calls onDone when the counter reaches the target value.
 */
export function useCountUp(
  target: number,
  options?: { duration?: number; delay?: number; onDone?: () => void }
) {
  const { delay = 0, onDone } = options ?? {};
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    // Variable speed: exponential ease-out per step
    // Early steps are fast (~80ms), final steps decelerate (~600ms+)
    const buildDelays = (n: number): number[] => {
      // Special tuning for known targets
      const presets: Record<number, number[]> = {
        6: [80, 100, 140, 280, 500, 900],
        8: [60, 80, 100, 140, 200, 320, 500, 800],
      };
      if (presets[n]) return presets[n];

      // Generic: quadratic ease-out curve
      return Array.from({ length: n }, (_, i) => {
        const t = i / Math.max(n - 1, 1);
        return Math.round(80 + t * t * 700);
      });
    };

    const delays = buildDelays(target);

    const timeout = setTimeout(() => {
      let step = 0;

      const tick = () => {
        step++;
        setValue(step);

        if (step < target) {
          setTimeout(tick, delays[step]);
        } else {
          setDone(true);
          onDone?.();
        }
      };

      setTimeout(tick, delays[0]);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, target, delay, onDone]);

  return { ref, value, done };
}
