"use client";
import { Mic } from "lucide-react";

export default function MicButton({ listening, onClick, size = 72 }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-full bg-primary hover:bg-primary-dark transition-colors ${
        listening ? "animate-pulse" : ""
      }`}
      style={{ width: size, height: size, minHeight: 56 }}
    >
      {/* Pulse ring when listening */}
      {listening && (
        <span
          className="absolute inset-0 rounded-full bg-primary/30 animate-ping"
          style={{ animationDuration: "1.5s" }}
        />
      )}
      <Mic className="text-white relative z-10" size={size * 0.4} />
    </button>
  );
}
