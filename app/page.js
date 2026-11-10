"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import MicButton from "@/components/MicButton";
import WorkerCard from "@/components/WorkerCard";
import TradeGrid from "@/components/TradeGrid";
import { Search, Mic, ArrowRight, Shield, Volume2, MessageSquare, Star, Users, CheckCircle, Wrench } from "lucide-react";

export default function LandingPage() {
  const { t, dir, lang } = useLanguage();
  const router = useRouter();
  const { startListening, listening } = useSpeech();
  const [query, setQuery] = useState("");
  const [topWorker, setTopWorker] = useState(null);
  const [topWorkers, setTopWorkers] = useState([]);

  // Fetch top-rated available worker (hero) + top 3 (section)
  useEffect(() => {
    async function fetchWorkers() {
      try {
        const { data } = await supabase
          .from("workers")
          .select("*")
          .eq("available", true)
          .order("rating", { ascending: false })
          .limit(4);
        if (data && data.length > 0) {
          setTopWorker(data[0]);
          setTopWorkers(data.slice(0, 3));
        }
      } catch (e) {
        // Supabase unreachable in dev — that's fine
      }
    }
    fetchWorkers();
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/customer?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleMic = () => {
    startListening((transcript) => {
      setQuery(transcript);
      if (transcript.trim()) {
        router.push(`/customer?q=${encodeURIComponent(transcript.trim())}`);
      }
    });
  };

  const handleChip = (text) => {
    router.push(`/customer?q=${encodeURIComponent(text)}`);
  };

  const handleTradeSelect = (trade) => {
    router.push(`/customer?trade=${trade}`);
  };

  const exampleChips = [
    t("exChip1"),
    t("exChip2"),
    t("exChip3"),
  ];

  return (
    <div className="flex flex-col gap-12 pb-12" dir={dir}>

      {/* ===== 1. HERO — 2 columns desktop, stacked mobile ===== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-6">
        {/* Left column: headline + voice search */}
        <div className="flex flex-col gap-6">
          <h1 className="font-nastaliq text-4xl lg:text-5xl font-bold text-ink leading-[2.2]" dir="rtl">
            {t("heroTitle")}
          </h1>
          <p className="text-lg text-ink/70" dir={dir}>
            {t("heroSubtitle")}
          </p>

          {/* Voice search bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t("searchPlaceholder")}
                className="w-full min-h-[56px] pl-12 pr-4 rounded-full border-2 border-card-border focus:border-primary outline-none text-lg"
                dir={dir}
              />
            </div>
            <MicButton listening={listening} onClick={handleMic} size={56} />
            <button
              onClick={handleSearch}
              className="min-h-[56px] px-6 bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors flex items-center gap-2"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Example chips */}
          <div className="flex flex-wrap gap-2">
            {exampleChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleChip(chip)}
                className="px-4 py-2 rounded-full bg-cream text-ink/80 text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Right column: floating worker card + stat chips */}
        <div className="flex flex-col items-center gap-4">
          {topWorker ? (
            <div className="w-full max-w-sm">
              <WorkerCard worker={topWorker} />
            </div>
          ) : (
            <div className="w-full max-w-sm h-64 rounded-2xl bg-cream animate-pulse" />
          )}

          {/* Stat chips */}
          <div className="flex gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 px-4 py-2 bg-cream rounded-full text-sm font-medium">
              <Shield size={16} className="text-primary" />
              {t("trustedBy")}
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-cream rounded-full text-sm font-medium">
              <Volume2 size={16} className="text-primary" />
              {t("voiceFirst")}
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-cream rounded-full text-sm font-medium">
              <MessageSquare size={16} className="text-primary" />
              {t("noTyping")}
            </span>
          </div>
        </div>
      </section>

      {/* ===== 2. ROLE CHOOSER ===== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/customer")}
          className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-ink text-white hover:bg-ink/90 transition-colors min-h-[56px]"
        >
          <Search size={40} />
          <span className="text-xl font-semibold">{t("findWorkers")}</span>
          <span className="text-sm text-white/70">{t("heroSubtitle")}</span>
        </button>
        <button
          onClick={() => router.push("/worker")}
          className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-primary text-white hover:bg-primary-dark transition-colors min-h-[56px]"
        >
          <Wrench size={40} />
          <span className="text-xl font-semibold">{t("registerNow")}</span>
          <span className="text-sm text-white/70">{t("workerCtaSub")}</span>
        </button>
      </section>

      {/* ===== 3. TRADE GRID ===== */}
      <section>
        <h2 className="font-nastaliq text-2xl font-bold text-ink mb-4" dir="rtl">
          {t("allTrades")}
        </h2>
        <TradeGrid onSelect={handleTradeSelect} />
      </section>

      {/* ===== 4. HOW IT WORKS ===== */}
      <section className="bg-cream rounded-2xl p-8">
        <h2 className="font-nastaliq text-2xl font-bold text-ink mb-6 text-center" dir="rtl">
          {t("howItWorks")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: Mic, title: t("step1Title"), desc: t("step1Desc") },
            { icon: Users, title: t("step2Title"), desc: t("step2Desc") },
            { icon: CheckCircle, title: t("step3Title"), desc: t("step3Desc") },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon size={32} className="text-primary" />
              </div>
              <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">
                {i + 1}
              </div>
              <h3 className="font-nastaliq text-lg font-bold text-ink" dir="rtl">{step.title}</h3>
              <p className="text-sm text-ink/60" dir={dir}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 5. TOP WORKERS ===== */}
      <section>
        <h2 className="font-nastaliq text-2xl font-bold text-ink mb-4" dir="rtl">
          {t("topWorkers")}
        </h2>
        {topWorkers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topWorkers.map((w) => (
              <WorkerCard key={w.id} worker={w} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-cream animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* ===== 6. WORKER CTA BANNER ===== */}
      <section className="bg-ink rounded-2xl p-8 text-white text-center flex flex-col items-center gap-4">
        <Wrench size={40} />
        <h2 className="font-nastaliq text-2xl font-bold leading-[2.2]" dir="rtl">
          {t("workerCta")}
        </h2>
        <p className="text-white/70 max-w-md" dir={dir}>
          {t("workerCtaSub")}
        </p>
        <button
          onClick={() => router.push("/worker")}
          className="min-h-[56px] px-8 bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors flex items-center gap-2"
        >
          {t("registerNow")}
          <ArrowRight size={20} />
        </button>
      </section>

      {/* ===== 7. FOOTER ===== */}
      <footer className="bg-ink rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          </div>
          <span className="text-white font-semibold">Roshan Rozgar</span>
        </div>
        <p className="font-nastaliq text-white/60 text-sm" dir="rtl">
          {t("footerTagline")}
        </p>
      </footer>
    </div>
  );
}
