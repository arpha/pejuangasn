import React from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function LogoIcon({ size = 40, className, ...props }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none overflow-hidden shrink-0", className)}
      {...props}
    >
      {/* Background Container with Logo Sand Color */}
      <rect width="100" height="100" rx="20" fill="#DDD7C8" />
      
      {/* Unified Solid Silhouette of the K shape in Dark Navy */}
      <path
        d="M26 22 H40 V36 L70 13 L78 25 L48 48 L62 62 V78 H48 V66 L40 58 V78 H26 Z"
        fill="#23384E"
      />
      
      {/* Thinner Sand-colored Inline running through the center of the shape */}
      <path
        d="M33 27V73 M33 47 L74 19 M33 47 L55 64 V73"
        stroke="#DDD7C8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
