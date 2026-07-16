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
      className={cn("rounded-xl select-none overflow-hidden shadow-sm border border-[#23384E]/10", className)}
      {...props}
    >
      {/* Background with Logo Beige/Sand color */}
      <rect width="100" height="100" fill="#DDD7C8" />
      
      {/* The logo paths with dual stroke to create the hollow inline effect */}
      {/* 1. Outer Dark Navy Outline (Thick) */}
      <g stroke="#23384E" strokeWidth="12" strokeLinecap="square" strokeLinejoin="miter">
        {/* Left vertical bar */}
        <path d="M34 25V75" />
        {/* Top-right branch */}
        <path d="M34 50L68 26" />
        {/* Bottom-right branch with a vertical bend at the end */}
        <path d="M47 41L59 60V75" />
      </g>
      
      {/* 2. Inner Sand/Beige Outline (Thin, draws over the navy to make it hollow) */}
      <g stroke="#DDD7C8" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        {/* Left vertical bar inner line */}
        <path d="M34 25V75" />
        {/* Top-right branch inner line */}
        <path d="M34 50L68 26" />
        {/* Bottom-right branch inner line */}
        <path d="M47 41L59 60V75" />
      </g>
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
