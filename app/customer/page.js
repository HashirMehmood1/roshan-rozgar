"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import MicButton from "@/components/MicButton";
import TradeGrid from "@/components/TradeGrid";
import WorkerCard from "@/components/WorkerCard";
import { MapPin, AlertTriangle, Minus, Plus, X } from "lucide-react";

const AREAS = ["G-9", "F-11", "I-8", "H-12", "G-13", "F-7"];
const TRADES = ["electrician", "plumber", "ac_technician", "carpenter", "mechanic", "painter"];

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-ink/50">Loading...</div>}>
      <CustomerPageInner />
    </Suspense>
  );
}

function CustomerPageInner() {
  const { t, dir, mounted } = useLanguage();
  const { startListening, speak } = useSpeech();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Setup state
  const [setupDone, setSetupDone] = useState(false);
  const [custName, setCustName] = useState("");
  const [custArea, setCustArea] = useState("G-9");

  // Problem + AI
  const [problemText, setProblemText] = useState("");
  const [listening, setListening] = useState(false);
  const [aiTrade, setAiTrade] = useState(null);
  const [aiUrgency, setAiUrgency] = useState("normal");
  const [aiSummary, setAiSummary] = useState("");

  // Filters
  const [filterTrade, setFilterTrade] = useState(null); // null = all
  const [filterArea, setFilterArea] = useState(null); // null = all

  // Workers + booking
  const [workers, setWorkers] = useState([]);
  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookPrice, setBookPrice] = useState(0);
  const [booking, setBooking] = useState(false);

  // Init: check localStorage for customer identity
  useEffect(() => {
    if (!mounted) return;
    const n = localStorage.getItem("customer_name");
    const a = localStorage.getItem("customer_area");
    if (n && a) {
      setCustName(n);
      setCustArea(a);
      setSetupDone(true);
    }
  }, [mounted]);

  // Read URL params after setup
  useEffect(() => {
    if (!setupDone) return;
    const qParam = searchParams.get("q");
    const tradeParam = searchParams.get("trade");
    if (tradeParam && TRADES.includes(tradeParam)) {
      setFilterTrade(tradeParam);
    }
    if (qParam) {
      setProblemText(qParam);
      detectProblem(qParam);
    }
    fetchWorkers();
  }, [setupDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch available workers
  const fetchWorkers = useCallback(async () => {
    const { data } = await supabase
      .from("workers")
      .select("*")
      .eq("available", true)
      .order("rating", { ascending: false });
    setWorkers(data || []);
  }, []);

  // AI detect
  const detectProblem = async (text) => {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "detect", text }),
      });
      const data = await res.json();
      if (data.result && !data.error) {
        if (data.result.trade && TRADES.includes(data.result.trade)) {
          setAiTrade(data.result.trade);
          setFilterTrade(data.result.trade);
        }
        setAiUrgency(data.result.urgency || "normal");
        setAiSummary(data.result.summary || "");
      }
    } catch {
      // fallback: manual filter
    }
  };

  // Voice input
  const handleMic = () => {
    setListening(true);
    startListening((text) => {
      setListening(false);
      setProblemText(text);
    });
  };

  // Find workers button
  const handleFind = () => {
    if (problemText.trim()) {
      detectProblem(problemText.trim());
    }
    fetchWorkers();
  };

  // Save customer setup
  const handleSetup = () => {
    if (!custName.trim()) return;
    localStorage.setItem("customer_name", custName.trim());
    localStorage.setItem("customer_area", custArea);
    setSetupDone(true);
  };

  // Filter workers client-side
  const filtered = workers.filter((w) => {
    if (filterTrade && w.trade !== filterTrade) return false;
    if (filterArea && w.area !== filterArea) return false;
    return true;
  });

  // Open booking panel
  const handleBook = (worker) => {
    setBookingWorker(worker);
    setBookPrice(worker.rate);
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (!bookingWorker || booking) return;
    setBooking(true);
    try {
      const { data: job } = await supabase.from("jobs").insert({
        worker_id: bookingWorker.id,
        customer_name: localStorage.getItem("customer_name"),
        customer_area: localStorage.getItem("customer_area"),
        problem: problemText || aiSummary || "",
        trade: bookingWorker.trade,
        urgency: aiUrgency || "normal",
        price_offered: bookPrice,
        status: "pending",
      }).select().single();

      // Mark worker unavailable
      await supabase.from("workers").update({ available: false }).eq("id", bookingWorker.id);

      speak(t("bookingSuccess"));

      if (job) {
        router.push(`/job/${job.id}`);
      }
    } catch {
      // silent fail
    }
    setBooking(false);
  };

  if (!mounted) return <div className="text-center py-20 text-ink/50">Loading...</div>;

  // ─── SETUP CARD ───
  if (!setupDone) {
    return (
      <div className="py-10 flex justify-center" dir={dir}>
        <div className="w-full max-w-md bg-white border border-card-border rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className="font-nastaliq text-2xl font-bold text-center" dir="rtl">{t("setupName")}</h2>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">{t("yourName")}</label>
            <input
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              className="w-full px-4 py-3 border border-card-border rounded-xl text-lg font-nastaliq"
              dir="rtl"
              placeholder={t("yourName")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-2">{t("yourArea")}</label>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button
                  key={a}
                  onClick={() => setCustArea(a)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
                    custArea === a ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSetup}
            disabled={!custName.trim()}
            className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors disabled:opacity-50"
          >
            {t("continueBtn")}
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN PAGE ───
  return (
    <div className="py-6 space-y-6" dir={dir}>
      {/* Problem card */}
      <div className="bg-white border border-card-border rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-nastaliq text-xl font-bold" dir="rtl">{t("speakProblem")}</h2>
        <div className="flex gap-3 items-start">
          <input
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            className="flex-1 px-4 py-3 border border-card-border rounded-xl text-lg font-nastaliq"
            dir="rtl"
            placeholder={t("descProblem")}
          />
          <MicButton listening={listening} onClick={handleMic} size={56} />
        </div>
        <button
          onClick={handleFind}
          className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors"
        >
          {t("findWorkers")}
        </button>
      </div>

      {/* AI summary + urgency badge */}
      {aiSummary && (
        <div className="flex items-start gap-3 bg-cream rounded-2xl p-4">
          {aiUrgency === "urgent" && (
            <span className="shrink-0 flex items-center gap-1 px-3 py-1 bg-red text-white text-sm font-semibold rounded-full">
              <AlertTriangle size={14} />
              {t("urgent")}
            </span>
          )}
          <p className="font-nastaliq text-ink/80 flex-1" dir="rtl">{aiSummary}</p>
        </div>
      )}

      {/* Filter row */}
      <div className="space-y-3">
        {/* Trade chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTrade(null)}
            className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
              !filterTrade ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
            }`}
          >
            {t("allTrades")}
          </button>
          {TRADES.map((tr) => (
            <button
              key={tr}
              onClick={() => setFilterTrade(filterTrade === tr ? null : tr)}
              className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
                filterTrade === tr ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
              }`}
            >
              {t(tr)}
            </button>
          ))}
        </div>
        {/* Area chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterArea(null)}
            className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
              !filterArea ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
            }`}
          >
            {t("allAreas")}
          </button>
          {AREAS.map((a) => (
            <button
              key={a}
              onClick={() => setFilterArea(filterArea === a ? null : a)}
              className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
                filterArea === a ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Worker results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-nastaliq text-xl text-ink/40" dir="rtl">{t("noWorkers")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((w) => (
            <WorkerCard key={w.id} worker={w} onBook={handleBook} />
          ))}
        </div>
      )}

      {/* Booking confirm panel (modal overlay) */}
      {bookingWorker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 relative">
            <button
              onClick={() => setBookingWorker(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cream flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <h3 className="font-nastaliq text-xl font-bold text-center" dir="rtl">{t("confirmBooking")}</h3>

            {/* Worker info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary font-bold text-lg">
                {bookingWorker.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-nastaliq font-bold text-lg" dir="rtl">{bookingWorker.name}</p>
                <span className="text-sm text-ink/60">{t(bookingWorker.trade)} · {bookingWorker.area}</span>
              </div>
            </div>

            {/* Problem */}
            {(problemText || aiSummary) && (
              <div className="bg-cream rounded-xl p-3">
                <p className="font-nastaliq text-sm text-ink/70" dir="rtl">{problemText || aiSummary}</p>
              </div>
            )}

            {/* Price stepper */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-2">{t("priceOffered")}</label>
              <div className="flex items-center gap-4 justify-center">
                <button
                  onClick={() => setBookPrice(Math.max(500, bookPrice - 100))}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Minus size={24} />
                </button>
                <span className="text-2xl font-bold text-ink min-w-[120px] text-center">
                  Rs {bookPrice.toLocaleString()}
                </span>
                <button
                  onClick={() => setBookPrice(bookPrice + 100)}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setBookingWorker(null)}
                className="flex-1 min-h-[56px] border-2 border-card-border text-ink text-lg font-semibold rounded-full"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={booking}
                className="flex-1 min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full disabled:opacity-50"
              >
                {t("confirmAndBook")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
