import React from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
}

export function LogoIcon({ size = 40, className, style, ...props }: LogoIconProps) {
  return (
    <img
      src="/logo.png"
      alt="Kawan ASN Logo Icon"
      width={size}
      height={size}
      className={cn("select-none shrink-0 rounded-full object-contain", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    />
  );
}

export function Logo({ className, size = 32, showText = true }: { className?: string; size?: number; showText?: boolean }) {
  if (showText) {
    return (
      <img
        src="/logo-full.png"
        alt="Kawan ASN Logo"
        className={cn("select-none shrink-0 object-contain", className)}
        style={{ height: size, width: "auto" }}
      />
    );
  }

  return <LogoIcon size={size} className={className} />;
}
