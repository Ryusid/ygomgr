"use client";

import { useState } from "react";

type CardImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  quantity?: number;
  missing?: number;
  usedElsewhere?: number;
  frameType?: string | null;
  size?: "sm" | "md" | "lg" | "full";
};

export default function CardImage({
  src,
  alt,
  className = "",
  quantity,
  missing,
  usedElsewhere,
  frameType,
  size = "md",
}: CardImageProps) {
  const [imageError, setImageError] = useState(false);

  // Card frame glow or accent border based on card frame_type
  function getBorderColor() {
    const frame = frameType?.toLowerCase() || "";
    if (frame.includes("spell")) return "border-emerald-500/60 shadow-emerald-500/10";
    if (frame.includes("trap")) return "border-pink-500/60 shadow-pink-500/10";
    if (frame.includes("fusion")) return "border-purple-500/60 shadow-purple-500/10";
    if (frame.includes("synchro")) return "border-slate-300/80 shadow-slate-300/10";
    if (frame.includes("xyz")) return "border-slate-800 shadow-slate-900/50";
    if (frame.includes("link")) return "border-blue-600/70 shadow-blue-600/10";
    if (frame.includes("ritual")) return "border-sky-500/60 shadow-sky-500/10";
    if (frame.includes("effect")) return "border-amber-600/60 shadow-amber-600/10";
    return "border-slate-700/80";
  }

  const dimensions = {
    sm: "w-16 h-24",
    md: "w-24 h-36",
    lg: "w-32 h-48",
    full: "w-full aspect-[3/4.35]",
  }[size];

  return (
    <div
      className={`relative group shrink-0 overflow-hidden rounded-md border ${getBorderColor()} bg-slate-900 shadow-md ${dimensions} ${className}`}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-slate-900 to-slate-950">
          <span className="text-2xl">🃏</span>
          <span className="mt-1 line-clamp-2 text-[10px] font-bold text-slate-400">{alt}</span>
        </div>
      )}

      {/* Quantity badge (top right) */}
      {typeof quantity === "number" && quantity > 0 && (
        <div className="absolute top-1 right-1 rounded bg-black/85 border border-amber-500/50 px-1.5 py-0.5 text-[10px] font-black text-amber-300 shadow-lg backdrop-blur-sm">
          x{quantity}
        </div>
      )}

      {/* Missing badge (bottom left) */}
      {typeof missing === "number" && missing > 0 && (
        <div className="absolute bottom-1 left-1 rounded bg-rose-950/90 border border-rose-600/60 px-1.5 py-0.5 text-[10px] font-black text-rose-300 shadow-lg backdrop-blur-sm">
          -{missing}
        </div>
      )}

      {/* Used elsewhere badge (bottom right) */}
      {typeof usedElsewhere === "number" && usedElsewhere > 0 && (
        <div className="absolute bottom-1 right-1 rounded bg-amber-950/90 border border-amber-600/60 px-1.5 py-0.5 text-[10px] font-black text-amber-300 shadow-lg backdrop-blur-sm">
          O{usedElsewhere}
        </div>
      )}
    </div>
  );
}
