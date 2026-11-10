"use client";
import { useLanguage } from "@/lib/translations";

const options = [
  { key: "ur", label: "اردو" },
  { key: "roman", label: "Roman" },
  { key: "en", label: "EN" },
];

export default function LanguageSwitch() {
  const { lang, setLang, mounted } = useLanguage();

  if (!mounted) return null;

  return (
    <div className="flex bg-cream rounded-full p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setLang(opt.key)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            lang === opt.key
              ? "bg-primary text-white"
              : "text-ink/60 hover:text-ink"
          }`}
          style={opt.key === "ur" ? { fontFamily: "'Noto Nastaliq Urdu', serif" } : {}}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
