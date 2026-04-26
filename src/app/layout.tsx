import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";

export const metadata: Metadata = {
  title: {
    default: "Notecount — engagement intelligence for creators",
    template: "%s · Notecount",
  },
  description:
    "Notecount predicts, explains, and improves your posts before you publish. Built on the published Tumblr × Reddit engagement model.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-svh antialiased scrollbar-thin">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <ThemedToaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
