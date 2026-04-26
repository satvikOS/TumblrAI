"use client";
import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export function Logo3D({
  size = 36,
  className,
  withWordmark = false,
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}) {
  // Mouse-driven offset (overrides idle when active)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hovering = useRef(false);

  // Continuous idle rotation — gentle figure-eight in 3D space
  const t = useMotionValue(0);
  useEffect(() => {
    const controls = animate(t, 1, {
      duration: 8,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [t]);

  const idleY = useTransform(t, (v) => Math.sin(v * Math.PI * 2) * 26);
  const idleX = useTransform(t, (v) => Math.sin(v * Math.PI * 4) * 14);

  // Combine mouse + idle (mouse wins when active)
  const combinedX = useTransform([x, idleX], (vals) => {
    const [mx, ix] = vals as [number, number];
    return hovering.current ? mx : ix;
  });
  const combinedY = useTransform([y, idleY], (vals) => {
    const [my, iy] = vals as [number, number];
    return hovering.current ? my : iy;
  });

  const sx = useSpring(combinedX, { stiffness: 90, damping: 18, mass: 0.8 });
  const sy = useSpring(combinedY, { stiffness: 90, damping: 18, mass: 0.8 });

  const rotateY = useTransform(sx, [-50, 50], [-30, 30]);
  const rotateX = useTransform(sy, [-50, 50], [25, -25]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * 100);
    y.set(((e.clientY - r.top) / r.height - 0.5) * 100);
    hovering.current = true;
  }
  function onLeave() {
    hovering.current = false;
  }

  const id = useId().replace(/:/g, "_");

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className="perspective"
        style={{ width: size, height: size }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <motion.div
          className="preserve-3d relative grid h-full w-full place-items-center"
          style={{ rotateX, rotateY }}
        >
          {/* Backing plane (depth shadow) */}
          <div
            className="absolute inset-0 rounded-[28%] opacity-30 blur-md"
            style={{
              transform: "translateZ(-14px) scale(1.06)",
              background:
                "linear-gradient(135deg, var(--grad-1), var(--grad-2) 60%, var(--grad-3))",
            }}
          />
          {/* Mid layer */}
          <div
            className="absolute inset-0 rounded-[28%] opacity-90"
            style={{
              transform: "translateZ(-7px)",
              background:
                "linear-gradient(135deg, var(--grad-1), var(--grad-2) 60%, var(--grad-3))",
            }}
          />
          {/* Top layer (the visible tile) */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[28%]"
            style={{
              transform: "translateZ(0px)",
              background:
                "linear-gradient(135deg, var(--grad-1) 0%, var(--grad-2) 60%, var(--grad-3) 100%)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.4), inset 0 -2px 8px 0 rgba(0,0,0,0.22)",
            }}
          >
            {/* Animated specular sheen */}
            <motion.div
              className="absolute -inset-[20%]"
              style={{
                mixBlendMode: "screen",
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 50%)",
              }}
              animate={{
                x: ["-12%", "12%", "-12%"],
                y: ["-8%", "10%", "-8%"],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          {/* N letter floating above */}
          <svg
            viewBox="0 0 32 32"
            width={size * 0.62}
            height={size * 0.62}
            className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
            style={{ transform: "translateZ(10px)" }}
            aria-hidden
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <path
              d="M7 25 V7 H11 L21 19.5 V7 H25 V25 H21 L11 12.5 V25 Z"
              fill={`url(#${id})`}
            />
          </svg>
        </motion.div>
      </div>
      {withWordmark && (
        <span className="font-display text-[1.35em] font-semibold tracking-tight">
          Notecount
        </span>
      )}
    </div>
  );
}
