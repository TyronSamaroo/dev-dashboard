import { useEffect, useRef, useState, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { motion, useSpring, useTransform } from "framer-motion";

/**
 * Impact Slam rolling counter.
 * Digits scroll to target with variable speed, then trigger a synchronized
 * slam effect: number scales 1→1.4→1 with spring physics while the parent
 * card swells and shadow pulses.
 */
export function RollingCounter({
  value,
  suffix = "",
  delay = 0,
  growing = false,
  onSlam,
}: {
  value: number;
  suffix?: string;
  delay?: number;
  growing?: boolean;
  onSlam?: () => void;
}) {
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });
  const [rolling, setRolling] = useState(false);
  const [landed, setLanded] = useState(false);
  const hasTriggered = useRef(false);

  // Spring for the number slam: high stiffness, low damping = physical thud
  const slamSpring = useSpring(1, { stiffness: 600, damping: 12, mass: 0.8 });
  // Compose translateY (to hold the digit in place) + scale (for the slam)
  const slamTransform = useTransform(
    slamSpring,
    (s) => `translateY(calc(${value} * -1.2em)) scale(${s})`
  );

  const triggerSlam = useCallback(() => {
    setLanded(true);
    // Fire the number scale: snap to 1.4x then spring back
    slamSpring.set(1.4);
    // The spring physics will naturally pull it back to rest
    requestAnimationFrame(() => {
      slamSpring.set(1);
    });
    // Notify the parent card to trigger its swell + shadow pulse
    onSlam?.();
  }, [slamSpring, onSlam]);

  useEffect(() => {
    if (!inView || hasTriggered.current) return;
    hasTriggered.current = true;

    const timeout = setTimeout(() => {
      setRolling(true);

      // Variable speed: the roll takes ~2.5s total for growing, ~2s for normal
      // The CSS transition handles the deceleration curve.
      // Slam triggers at the end of the roll.
      const rollDuration = growing ? 3500 : 2000;
      setTimeout(triggerSlam, rollDuration);
    }, delay);

    return () => clearTimeout(timeout);
  }, [inView, delay, growing, triggerSlam]);

  return (
    <span ref={ref} className="rolling-counter">
      <span
        className={`rolling-digit-wrapper ${growing && rolling && !landed ? "wrapper-growing" : ""} ${growing && landed ? "wrapper-slam-back" : ""}`}
      >
        <motion.span
          className={`rolling-digit-strip ${rolling && !landed ? "rolling" : ""}`}
          style={{
            "--target": value,
            ...(landed ? { transform: slamTransform } : {}),
          } as React.CSSProperties}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className="rolling-digit-cell"
              aria-hidden={i !== value}
            >
              {i}
            </span>
          ))}
        </motion.span>
      </span>
      {suffix && (
        <span className={`rolling-suffix ${landed ? "suffix-visible" : ""}`}>
          {suffix}
        </span>
      )}
    </span>
  );
}
