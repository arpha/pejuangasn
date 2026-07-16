import React from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function LogoIcon({ size = 40, className, style, ...props }: LogoIconProps) {
  // Multiply the base size by 3 for 3x scaling
  const displaySize = size * 3;
  return (
    <img
      src="/logo.png"
      alt="Kawan ASN Logo Icon"
      width={displaySize}
      height={displaySize}
      className={cn("select-none shrink-0 rounded-full object-contain", className)}
      style={{ width: displaySize, height: displaySize, ...style }}
      {...props}
    />
  );
}

export function Logo({ className, size = 32, showText = true }: { className?: string; size?: number; showText?: boolean }) {
  if (showText) {
    // Multiply the base size by 3 for 3x scaling
    const displayHeight = size * 3;
    return (
      <img
        src="/logo-full.png"
        alt="Kawan ASN Logo"
        className={cn("select-none shrink-0 object-contain", className)}
        style={{ height: displayHeight, width: "auto" }}
      />
    );
  }

  return <LogoIcon size={size} className={className} />;
}
