import { type CSSProperties } from "react";
import { useInView } from "react-intersection-observer";

interface ScrollRevealOptions {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number; // ms — use index * 150 for stagger
}

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const { threshold = 0.1, triggerOnce = true, delay = 0 } = options;

  const { ref, inView } = useInView({ threshold, triggerOnce });

  const style: CSSProperties = {
    opacity: inView ? 1 : 0,
    transform: inView ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
  };

  return { ref, inView, style };
}
