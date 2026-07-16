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
      className={cn("select-none shrink-0", className)}
      {...props}
    >
      {/* Background Circle matching the logo image */}
      <circle cx="50" cy="50" r="46" fill="#DDD7C8" />
      
      {/* Group for Dark Navy Base Shape */}
      <g stroke="#23384E" strokeWidth="10" strokeLinecap="butt" strokeLinejoin="miter">
        {/* Left vertical stem */}
        <path d="M40 25V75" />
        {/* Top-right branch */}
        <path d="M40 46L65 27" />
        {/* Bottom-right branch */}
        <path d="M50 39.5L58 50V75" />
      </g>
      
      {/* Solid Navy Notch on the Left side of the stem */}
      <polygon points="35,43 31,46.5 35,50" fill="#23384E" />
      
      {/* Group for Inner Sand-colored Inline (Hollow Cutout) */}
      <g stroke="#DDD7C8" strokeWidth="4" strokeLinecap="butt" strokeLinejoin="miter">
        {/* Left vertical stem inline */}
        <path d="M40 25.1V74.9" />
        {/* Top-right branch inline */}
        <path d="M40 46L65 27" />
        {/* Bottom-right branch inline */}
        <path d="M50 39.5L58 50V74.9" />
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
