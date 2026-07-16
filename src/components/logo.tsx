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
  return (
    <div className={cn("flex items-center gap-3 select-none", className)}>
      <LogoIcon size={size} />
      {showText && (
        <span className="font-black text-xl tracking-tight text-[#23384E] dark:text-[#DDD7C8]">
          Kawan <span className="text-indigo-600 dark:text-indigo-400">ASN</span>
        </span>
      )}
    </div>
  );
}
