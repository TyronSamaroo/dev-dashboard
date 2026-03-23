import { useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";

/**
 * Animates a number from 0 to target when the element enters the viewport.
 * Uses requestAnimationFrame with ease-out-cubic for a premium feel.
 */
export function useCountUp(
  target: number,
  options?: { duration?: number; delay?: number }
) {
  const { duration = 2500, delay = 0 } = options ?? {};
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;

    const timeout = setTimeout(() => {
      let start: number | null = null;
      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-quart — slower deceleration, more dramatic
        const eased = 1 - Math.pow(1 - progress, 4);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDone(true);
        }
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, target, duration, delay]);

  return { ref, value, done };
}
