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
    <div className="flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -mt-6" dir={dir}>

      {/* ===== 1. HERO — centered, full-width photo background ===== */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFF7ED]/60 via-white/10 to-white" />
        </div>

        {/* Centered content */}
        <div className="relative z-10 mx-auto flex min-h-[520px] w-full max-w-4xl flex-col items-center justify-center px-4 py-20 text-center">
          <h1 className="font-nastaliq text-4xl lg:text-5xl font-bold leading-[2.2]" dir="rtl">
            <span className="text-ink">گھر کا کام ہے؟</span>
            <br />
            <span className="text-[#E85D00]">کاریگر یہیں، ابھی</span>
          </h1>
          <p className="text-lg text-ink/80 mt-2 font-medium text-center" dir={dir}>
            {t("heroSubtitle")}
          </p>

          {/* Trust chips */}
          <div className="flex gap-3 flex-wrap items-center justify-center mt-4">
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium shadow-sm">
              <Shield size={16} className="text-primary" />
              {t("trustedBy")}
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium shadow-sm">
              <Volume2 size={16} className="text-primary" />
              {t("voiceFirst")}
            </span>
            <span className="flex items-center gap-1.5 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-medium shadow-sm">
              <MessageSquare size={16} className="text-primary" />
              {t("noTyping")}
            </span>
          </div>

          {/* Voice search pill */}
          <div className="mx-auto w-full max-w-xl mt-8">
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
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
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

      {/* ===== 2. ROLE CHOOSER + TRADES — white bg ===== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Role chooser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/customer")}
              className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-ink text-white hover:bg-ink/90 transition-colors min-h-[56px]"
            >
              <Search size={40} />
              <span className="text-xl font-semibold">{t("roleCustomerTitle")}</span>
              <span className="text-sm text-white/70">{t("roleCustomerSub")}</span>
            </button>
            <button
              onClick={() => router.push("/worker")}
              className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-primary text-white hover:bg-primary-dark transition-colors min-h-[56px]"
            >
              <Wrench size={40} />
              <span className="text-xl font-semibold">{t("roleWorkerTitle")}</span>
              <span className="text-sm text-white/70">{t("roleWorkerSub")}</span>
            </button>
          </div>

          {/* Trades */}
          <div>
            <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl" dir="rtl">
              {t("allTrades")}
            </h2>
            <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-[#FF6B00]" />
            <div className="mt-8">
              <TradeGrid onSelect={handleTradeSelect} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Gradient bridge white → cream ===== */}
      <div className="h-16 bg-gradient-to-b from-white to-[#FFF7ED]" />

      {/* ===== 3. HOW IT WORKS — cream bg ===== */}
      <section className="bg-[#FFF7ED] py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl" dir="rtl">
            {t("howItWorks")}
          </h2>
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-[#FF6B00]" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
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
        </div>
      </section>

      {/* ===== Gradient bridge cream → white ===== */}
      <div className="h-16 bg-gradient-to-b from-[#FFF7ED] to-white" />

      {/* ===== 4. TOP WORKERS — white bg ===== */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-ink sm:text-4xl" dir="rtl">
            {t("topWorkers")}
          </h2>
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-[#FF6B00]" />

          <div className="mt-10">
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
          </div>
        </div>
      </section>

      {/* ===== 5. WORKER CTA BANNER — black, rounded inside wrapper ===== */}
      <section className="bg-white py-4">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-ink rounded-[2rem] p-8 sm:p-12 text-white text-center flex flex-col items-center gap-4">
            <Wrench size={40} />
            <h2 className="font-nastaliq text-2xl sm:text-3xl font-bold leading-[2.2]" dir="rtl">
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
          </div>
        </div>
      </section>
    </div>
  );
}
