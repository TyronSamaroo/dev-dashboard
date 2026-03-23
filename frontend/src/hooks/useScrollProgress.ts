import { useEffect, useState, useRef, useCallback } from "react";

/**
 * Tracks how far an element has scrolled through the viewport.
 * Returns a `progress` value from 0 (element just entering bottom) to 1 (element exiting top).
 * Uses requestAnimationFrame for performance + IntersectionObserver gating.
 */
export function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const isVisibleRef = useRef(false);
  const rafId = useRef<number>(0);
  const lastProgress = useRef(0);

  const computeProgress = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    const raw = (windowH - rect.top) / (windowH + rect.height);
    const clamped = Math.max(0, Math.min(1, raw));

    // Only update state when delta is meaningful
    if (Math.abs(clamped - lastProgress.current) > 0.001) {
      lastProgress.current = clamped;
      setProgress(clamped);
    }
  }, []);

  const tick = useCallback(() => {
    if (!isVisibleRef.current) return;
    computeProgress();
    rafId.current = requestAnimationFrame(tick);
  }, [computeProgress]);

  // IO gating — only run rAF loop when element is in viewport
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        isVisibleRef.current = visible;
        setIsVisible(visible);
        if (visible) {
          computeProgress();
          rafId.current = requestAnimationFrame(tick);
        } else {
          cancelAnimationFrame(rafId.current);
        }
      },
      { threshold: 0, rootMargin: "50px" }
    );

    observer.observe(el);

    // Also listen to scroll for immediate response
    const onScroll = () => {
      if (isVisibleRef.current) computeProgress();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [computeProgress, tick]);

  /**
   * Remap a sub-range of progress to 0-1.
   * e.g. clampedProgress(0.3, 0.7) returns 0 when progress<=0.3, 1 when progress>=0.7
   */
  const clampedProgress = useCallback(
    (min: number, max: number) => {
      if (progress <= min) return 0;
      if (progress >= max) return 1;
      return (progress - min) / (max - min);
    },
    [progress]
  );

  return { ref, progress, isVisible, clampedProgress };
}
