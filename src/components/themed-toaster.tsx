"use client";
import { Toaster } from "sonner";
import { useTheme } from "next-themes";

export function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark" | undefined) ?? "system"}
    />
  );
}
