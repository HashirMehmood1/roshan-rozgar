"use client";
import { Star } from "lucide-react";

export default function StarRating({ value = 0, onChange, size = 32 }) {
  const interactive = typeof onChange === "function";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onChange(star)}
          disabled={!interactive}
          className={`transition-transform ${interactive ? "hover:scale-110 cursor-pointer" : "cursor-default"}`}
          style={{ minWidth: size, minHeight: size }}
        >
          <Star
            size={size}
            className={
              star <= value
                ? "text-amber fill-amber"
                : "text-card-border"
            }
          />
        </button>
      ))}
    </div>
  );
}
