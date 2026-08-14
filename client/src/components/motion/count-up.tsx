"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

export function CountUp({
  value,
  format = (n: number) => Math.round(n).toLocaleString(),
  duration = 1.1,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const count = useMotionValue(0);
  const text = useTransform(count, (latest) => format(latest));

  useEffect(() => {
    if (!inView) {
      return;
    }
    const controls = animate(count, value, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [inView, value, duration, count]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
