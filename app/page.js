"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";

export default function Home() {
  const { t, dir } = useLanguage();
  const [workerCount, setWorkerCount] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCount() {
      const { count, error } = await supabase
        .from("workers")
        .select("*", { count: "exact", head: true });
      if (error) {
        setError(error.message);
      } else {
        setWorkerCount(count);
      }
    }
    fetchCount();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      {/* Logo */}
      <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-ink">Roshan Rozgar</h1>
      <p className="font-nastaliq text-3xl text-ink" dir="rtl">روشن روزگار</p>
      <p className="font-nastaliq text-xl text-primary" dir="rtl">{t("tagline")}</p>

      {/* Supabase test */}
      <div className="mt-8 px-6 py-3 bg-cream rounded-2xl border border-card-border">
        {error ? (
          <span className="text-red font-semibold">Error: {error}</span>
        ) : workerCount !== null ? (
          <span className="text-ink font-semibold text-lg">
            Workers in database: <span className="text-primary">{workerCount}</span>
          </span>
        ) : (
          <span className="text-ink/50">Loading...</span>
        )}
      </div>

      <div className="px-6 py-3 bg-green rounded-full">
        <span className="text-white font-semibold text-lg">✓ Phase 2 OK</span>
      </div>
    </div>
  );
}
