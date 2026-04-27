"use client";
import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { cn } from "@/lib/utils";

export type LogoMode = "idle" | "thinking" | "static";

export function Logo3D({
  size = 36,
  className,
  withWordmark = false,
  mode = "idle",
}: {
  size?: number;
  className?: string;
  withWordmark?: boolean;
  /**
   * idle      — slow continuous figure-8 rotation; reacts to hover
   * thinking  — fast multi-axis spin + bouncing scale (loading)
   * static    — held still
   */
  mode?: LogoMode;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hovering = useRef(false);

  // Continuous time driver (0..1 looping)
  const t = useMotionValue(0);
  useEffect(() => {
    if (mode === "static") return;
    const duration = mode === "thinking" ? 1.6 : 8;
    const controls = animate(t, 1, {
      duration,
      repeat: Infinity,
      ease: "linear",
    });
    return () => controls.stop();
  }, [t, mode]);

  // Ambient motion shape varies by mode
  const idleY = useTransform(t, (v) =>
    mode === "thinking"
      ? Math.sin(v * Math.PI * 2) * 70
      : Math.sin(v * Math.PI * 2) * 26,
  );
  const idleX = useTransform(t, (v) =>
    mode === "thinking"
      ? Math.cos(v * Math.PI * 4) * 55
      : Math.sin(v * Math.PI * 4) * 14,
  );
  const idleZ = useTransform(t, (v) =>
    mode === "thinking" ? Math.sin(v * Math.PI * 8) * 30 : 0,
  );

  // Combine pointer (when hovering) with ambient
  const combinedX = useTransform([x, idleX], (vals) => {
    const [mx, ix] = vals as [number, number];
    return hovering.current ? mx : ix;
  });
  const combinedY = useTransform([y, idleY], (vals) => {
    const [my, iy] = vals as [number, number];
    return hovering.current ? my : iy;
  });

  // Springs for smoothness
  const sx = useSpring(combinedX, {
    stiffness: mode === "thinking" ? 240 : 90,
    damping: mode === "thinking" ? 12 : 18,
    mass: 0.8,
  });
  const sy = useSpring(combinedY, {
    stiffness: mode === "thinking" ? 240 : 90,
    damping: mode === "thinking" ? 12 : 18,
    mass: 0.8,
  });
  const sz = useSpring(idleZ, { stiffness: 200, damping: 14 });

  const rotateY = useTransform(sx, [-100, 100], [-50, 50]);
  const rotateX = useTransform(sy, [-100, 100], [40, -40]);
  const rotateZ = useTransform(sz, [-30, 30], [-12, 12]);

  // Scale pulse during thinking
  const scale = useTransform(t, (v) =>
    mode === "thinking" ? 1 + Math.sin(v * Math.PI * 2) * 0.06 : 1,
  );

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (mode === "thinking") return;
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
        className="perspective select-none"
        style={{ width: size, height: size }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <motion.div
          className="preserve-3d relative grid h-full w-full place-items-center"
          style={{ rotateX, rotateY, rotateZ, scale }}
        >
          {/* Deep shadow plane */}
          <div
            className="absolute inset-0 rounded-[28%] opacity-25 blur-md"
            style={{
              transform: "translateZ(-18px) scale(1.08)",
              background:
                "linear-gradient(135deg, var(--grad-1), var(--grad-2) 60%, var(--grad-3))",
            }}
          />
          {/* Mid plane (rotated slightly for parallax) */}
          <motion.div
            className="absolute inset-0 rounded-[28%] opacity-80"
            style={{
              transform: "translateZ(-9px)",
              background:
                "linear-gradient(135deg, var(--grad-1), var(--grad-2) 60%, var(--grad-3))",
            }}
            animate={
              mode === "thinking"
                ? { rotate: [0, 8, -8, 0] }
                : { rotate: [0, 2, -2, 0] }
            }
            transition={{ duration: mode === "thinking" ? 2 : 7, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Top tile */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[28%]"
            style={{
              transform: "translateZ(0px)",
              background:
                "linear-gradient(135deg, var(--grad-1) 0%, var(--grad-2) 60%, var(--grad-3) 100%)",
              boxShadow:
                "inset 0 1px 0 0 rgba(255,255,255,0.45), inset 0 -2px 8px 0 rgba(0,0,0,0.22)",
            }}
          >
            {/* Animated specular sheen */}
            <motion.div
              className="absolute -inset-[20%]"
              style={{
                mixBlendMode: "screen",
                background:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 50%)",
              }}
              animate={{
                x: ["-12%", "12%", "-12%"],
                y: ["-8%", "10%", "-8%"],
              }}
              transition={{
                duration: mode === "thinking" ? 1.4 : 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Thinking-mode orbit ring */}
            {mode === "thinking" && (
              <motion.div
                className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
                style={{ mixBlendMode: "screen" }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              />
            )}
          </div>
          {/* N letter floating above */}
          <motion.svg
            viewBox="0 0 32 32"
            width={size * 0.62}
            height={size * 0.62}
            className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]"
            style={{ transform: "translateZ(12px)" }}
            aria-hidden
            animate={mode === "thinking" ? { rotateY: [0, 360] } : undefined}
            transition={mode === "thinking" ? { duration: 1.6, repeat: Infinity, ease: "linear" } : undefined}
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
          </motion.svg>
          {/* Sparkle particles in thinking mode */}
          {mode === "thinking" && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="absolute h-1 w-1 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                  style={{ transform: "translateZ(20px)" }}
                  animate={{
                    x: [0, Math.cos((i * 2 * Math.PI) / 3) * size * 0.8, 0],
                    y: [0, Math.sin((i * 2 * Math.PI) / 3) * size * 0.8, 0],
                    opacity: [0, 1, 0],
                    scale: [0.6, 1.2, 0.6],
                  }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                />
              ))}
            </>
          )}
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

// Centered loading state used wherever async work is happening.
export function LogoLoader({
  label,
  size = 56,
  className,
}: {
  label?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10", className)}>
      <Logo3D size={size} mode="thinking" />
      {label && (
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <span>{label}</span>
          <span className="dots ml-1.5 inline-flex align-middle">
            <span /><span /><span />
          </span>
        </div>
      )}
    </div>
  );
}

// Tiny inline version for buttons / next to text.
export function LogoSpinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center align-middle", className)} aria-hidden>
      <Logo3D size={size} mode="thinking" />
    </span>
  );
}
