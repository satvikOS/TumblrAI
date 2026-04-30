"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { avatarUrl } from "@/lib/social/seed-users";

export function UserAvatar({
  seed,
  size = 36,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden rounded-full bg-muted ring-1 ring-border",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatarUrl(seed)}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}
