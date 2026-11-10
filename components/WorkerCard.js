"use client";
import { MapPin, Star, Volume2, Briefcase } from "lucide-react";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";

export default function WorkerCard({ worker, onBook, trustLine }) {
  const { t, dir } = useLanguage();
  const { speak } = useSpeech();

  const initial = worker.name ? worker.name.charAt(0).toUpperCase() : "?";
  const ratingNum = Number(worker.rating) || 0;

  const handleSpeak = () => {
    const text = `${worker.name}, ${t(worker.trade)}, ${worker.area}, Rs ${worker.rate}`;
    speak(text);
  };

  return (
    <div className="bg-white border border-card-border rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      {/* Top row: avatar + info */}
      <div className="flex items-start gap-3" dir={dir}>
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center text-primary font-bold text-xl shrink-0">
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="font-nastaliq text-xl font-bold text-ink leading-tight truncate" dir="rtl">
            {worker.name}
          </h3>

          {/* Trade chip */}
          <span className="inline-block mt-1 px-3 py-0.5 bg-cream text-primary text-sm font-medium rounded-full">
            {t(worker.trade)}
          </span>

          {/* Area */}
          <div className="flex items-center gap-1 mt-1 text-sm text-ink/60">
            <MapPin size={14} />
            <span>{worker.area}</span>
          </div>
        </div>

        {/* Availability badge */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold text-white shrink-0 ${
            worker.available ? "bg-green" : "bg-red"
          }`}
        >
          {worker.available ? t("available") : t("busy")}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Star size={16} className="text-amber fill-amber" />
          <span className="font-semibold">{ratingNum.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1 text-ink/60">
          <Briefcase size={14} />
          <span>{worker.jobs_done || 0} {t("jobsDone")}</span>
        </div>
      </div>

      {/* Trust line */}
      {trustLine && (
        <p className="font-nastaliq text-sm text-ink/70 italic" dir="rtl">
          "{trustLine}"
        </p>
      )}

      {/* Price + actions */}
      <div className="flex items-center justify-between mt-1">
        <div>
          <span className="text-xl font-bold text-ink">Rs {Number(worker.rate).toLocaleString()}</span>
          <span className="text-sm text-ink/50 ml-1">/ {t("perVisit")}</span>
        </div>

        {/* Speaker button */}
        <button
          onClick={handleSpeak}
          className="w-10 h-10 rounded-full bg-cream flex items-center justify-center hover:bg-card-border transition-colors"
          title={t("listen")}
        >
          <Volume2 size={18} className="text-primary" />
        </button>
      </div>

      {/* Book button */}
      {onBook && worker.available && (
        <button
          onClick={() => onBook(worker)}
          className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors"
        >
          {t("book")}
        </button>
      )}
    </div>
  );
}
