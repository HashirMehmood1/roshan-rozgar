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

      {/* ===== 1. HERO — full-width photo background ===== */}
      <section className="relative -mx-4 -mt-6 min-h-[420px] lg:min-h-[520px] flex flex-col justify-between overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Gradient overlay: cream fade from top-left, transparent middle, white at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF7ED]/70 via-transparent to-white" />
          <div className={`absolute inset-0 ${dir === 'rtl' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#FFF7ED]/60 via-transparent to-transparent`} />
        </div>

        {/* Headline — sits in the sky area */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 lg:pt-12 w-full">
          <div className={`max-w-lg ${dir === 'rtl' ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
            <h1 className="font-nastaliq text-4xl lg:text-5xl font-bold leading-[2.2]" dir="rtl">
              <span className="text-ink">گھر کا کام ہے؟</span>
              <br />
              <span className="text-[#E85D00]">کاریگر یہیں، ابھی</span>
            </h1>
            <p className="text-lg text-ink/80 mt-2 font-medium" dir={dir}>
              {t("heroSubtitle")}
            </p>
          </div>
        </div>

        {/* Voice search pill — floated over lower third */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8 w-full">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full shadow-xl p-2">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={t("searchPlaceholder")}
                  className="w-full min-h-[48px] pl-12 pr-4 rounded-full bg-transparent outline-none text-lg"
                  dir={dir}
                />
              </div>
              <MicButton listening={listening} onClick={handleMic} size={48} />
              <button
                onClick={handleSearch}
                className="min-h-[48px] px-5 bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors flex items-center gap-2"
              >
                <Search size={20} />
              </button>
            </div>
            {/* Example chips */}
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {exampleChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleChip(chip)}
                  className="px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm text-ink/80 text-sm font-medium hover:bg-white transition-colors shadow-sm"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TRUST STRIP — below hero ===== */}
      <div className="flex gap-3 flex-wrap justify-center -mt-6">
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
          <img src="/logo.png" alt="Roshan Rozgar" className="w-8 h-8 rounded-lg" />
          <span className="text-white font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>Roshan Rozgar</span>
        </div>
        <p className="font-nastaliq text-white/60 text-sm" dir="rtl">
          {t("footerTagline")}
        </p>
      </footer>
    </div>
  );
}
