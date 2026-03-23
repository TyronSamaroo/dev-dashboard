import { type CSSProperties } from "react";
import { useInView } from "react-intersection-observer";

type Variant = "fade-up" | "scale-in" | "slide-left" | "slide-right";

interface ScrollRevealOptions {
  threshold?: number;
  triggerOnce?: boolean;
  delay?: number;
  variant?: Variant;
  duration?: number;
}

const variantStyles: Record<Variant, { hidden: CSSProperties; visible: CSSProperties }> = {
  "fade-up": {
    hidden: { opacity: 0, transform: "translateY(32px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "scale-in": {
    hidden: { opacity: 0, transform: "scale(0.92)", filter: "blur(4px)" },
    visible: { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
  },
  "slide-left": {
    hidden: { opacity: 0, transform: "translateX(-40px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "slide-right": {
    hidden: { opacity: 0, transform: "translateX(40px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
};

export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    triggerOnce = true,
    delay = 0,
    variant = "fade-up",
    duration = 0.7,
  } = options;

  const { ref, inView } = useInView({ threshold, triggerOnce });
  const v = variantStyles[variant];

  const transitionProps = Object.keys(v.hidden).join(", ").replace(/opacity/g, "opacity").replace(/transform/g, "transform").replace(/filter/g, "filter");
  const transition = transitionProps
    .split(", ")
    .map((prop) => `${prop} ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`)
    .join(", ");

  const style: CSSProperties = {
    ...(inView ? v.visible : v.hidden),
    transition,
    willChange: "opacity, transform, filter",
  };

  return { ref, inView, style };
}
