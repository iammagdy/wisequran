import { useInView } from "framer-motion";
import { useRef } from "react";

export function useFadeInView(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -40px 0px" });

  const style = {
    opacity: isInView ? 1 : 0,
    transform: isInView ? "translateY(0px)" : "translateY(18px)",
    transition: `opacity 0.4s ease ${delay}s, transform 0.4s ease ${delay}s`,
  };

  return { ref, style };
}
