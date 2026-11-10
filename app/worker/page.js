"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import MicButton from "@/components/MicButton";
import TradeGrid from "@/components/TradeGrid";
import StarRating from "@/components/StarRating";
import { MapPin, Star, Briefcase, RefreshCw, Volume2, Plus, Minus, Phone } from "lucide-react";

const AREAS = ["G-9", "F-11", "I-8", "H-12", "G-13", "F-7"];
const DEFAULT_RATES = {
  electrician: 1500, plumber: 1200, ac_technician: 2000,
  carpenter: 1800, mechanic: 1500, painter: 2500,
};

export default function WorkerPage() {
  const { t, dir, mounted } = useLanguage();
  const { startListening, speak } = useSpeech();

  const [workerId, setWorkerId] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | onboard | confirm | dashboard
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Profile fields
  const [name, setName] = useState("");
  const [trade, setTrade] = useState("electrician");
  const [area, setArea] = useState("G-9");
  const [rate, setRate] = useState(1500);
  const [experience, setExperience] = useState(3);
  const [phone, setPhone] = useState("");

  // Dashboard state
  const [worker, setWorker] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [available, setAvailable] = useState(true);

  // Init: check localStorage
  useEffect(() => {
    if (!mounted) return;
    const id = localStorage.getItem("worker_id");
    if (id) {
      setWorkerId(id);
      setPhase("dashboard");
    } else {
      setPhase("onboard");
    }
  }, [mounted]);

  // Dashboard: fetch worker + jobs
  const fetchDashboard = useCallback(async () => {
    if (!workerId) return;
    const { data: w } = await supabase.from("workers").select("*").eq("id", workerId).single();
    if (w) {
      setWorker(w);
      setAvailable(w.available);
    }
    const { data: pJobs } = await supabase
      .from("jobs").select("*").eq("worker_id", workerId).eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingJobs(pJobs || []);
    const { data: aJobs } = await supabase
      .from("jobs").select("*").eq("worker_id", workerId).eq("status", "accepted")
      .order("created_at", { ascending: false });
    setActiveJobs(aJobs || []);
  }, [workerId]);

  useEffect(() => {
    if (phase === "dashboard" && workerId) fetchDashboard();
  }, [phase, workerId, fetchDashboard]);

  // Voice onboarding
  const handleMic = () => {
    setListening(true);
    startListening((text) => {
      setListening(false);
      setTranscript(text);
      // Call AI to extract profile
      extractProfile(text);
    });
  };

  // AI offline flag
  const [aiFailed, setAiFailed] = useState(false);

  // Keyword → trade fallback
  const KEYWORD_MAP = [
    { keywords: ["bijli", "بجلی", "light", "wire", "electric", "بتی"], trade: "electrician" },
    { keywords: ["paani", "پانی", "nal", "نل", "pipe", "plumb"], trade: "plumber" },
    { keywords: ["ac", "ائر", "air condition", "thanda", "ٹھنڈا"], trade: "ac_technician" },
    { keywords: ["darwaza", "دروازہ", "lakri", "لکڑی", "wood", "almari"], trade: "carpenter" },
    { keywords: ["gaari", "گاڑی", "car", "engine", "motor"], trade: "mechanic" },
    { keywords: ["rang", "رنگ", "paint", "پینٹ", "wall"], trade: "painter" },
  ];

  const keywordDetectTrade = (text) => {
    const lower = text.toLowerCase();
    for (const entry of KEYWORD_MAP) {
      for (const kw of entry.keywords) {
        if (lower.includes(kw)) return entry.trade;
      }
    }
    return null;
  };

  const extractProfile = async (text) => {
    setAiFailed(false);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "profile", text }),
      });
      const data = await res.json();
      if (data.result && !data.error) {
        setName(data.result.name || "");
        setTrade(data.result.trade || "electrician");
        setArea(data.result.area || "G-9");
        setRate(data.result.rate || DEFAULT_RATES[data.result.trade] || 1500);
        setExperience(data.result.experience_years || 3);
        setPhase("confirm");
        return;
      }
    } catch {
      // fall through to keyword fallback
    }
    // AI failed — try keyword match for trade, show aiOfflineNote
    const matched = keywordDetectTrade(text);
    if (matched) {
      setTrade(matched);
      setRate(DEFAULT_RATES[matched] || 1500);
    }
    setAiFailed(true);
    setPhase("confirm");
  };

  // Save profile
  const handleSave = async () => {
    const { data, error } = await supabase.from("workers").insert({
      name, trade, area, rate, experience_years: experience, phone,
      available: true, rating: 0, jobs_done: 0,
    }).select().single();
    if (data && !error) {
      localStorage.setItem("worker_id", data.id);
      setWorkerId(data.id);
      speak(t("profileSaved"));
      setPhase("dashboard");
    }
  };

  // Toggle availability
  const toggleAvailability = async () => {
    const newVal = !available;
    setAvailable(newVal);
    await supabase.from("workers").update({ available: newVal }).eq("id", workerId);
  };

  // Accept job
  const handleAccept = async (jobId) => {
    await supabase.from("jobs").update({ status: "accepted" }).eq("id", jobId);
    await supabase.from("workers").update({ available: false }).eq("id", workerId);
    setAvailable(false);
    fetchDashboard();
  };

  // Reject job — also free the worker (customer page marks unavailable at booking)
  const handleReject = async (jobId) => {
    await supabase.from("jobs").update({ status: "rejected" }).eq("id", jobId);
    await supabase.from("workers").update({ available: true }).eq("id", workerId);
    setAvailable(true);
    fetchDashboard();
  };

  // Complete job
  const handleComplete = async (jobId) => {
    await supabase.from("jobs").update({ status: "completed" }).eq("id", jobId);
    const newJobsDone = (worker?.jobs_done || 0) + 1;
    await supabase.from("workers").update({ available: true, jobs_done: newJobsDone }).eq("id", workerId);
    setAvailable(true);
    fetchDashboard();
  };

  if (!mounted || phase === "loading") {
    return <div className="text-center py-20 text-ink/50">Loading...</div>;
  }

  // ─── ONBOARDING ───
  if (phase === "onboard" || phase === "confirm") {
    return (
      <div className="py-6 space-y-6" dir={dir}>
        <h1 className="font-nastaliq text-2xl font-bold text-center" dir="rtl">{t("onboardTitle")}</h1>

        {phase === "onboard" && (
          <div className="flex flex-col items-center gap-6">
            <p className="font-nastaliq text-center text-ink/70 max-w-md" dir="rtl">{t("onboardInstr")}</p>

            {/* Read aloud button */}
            <button
              onClick={() => speak(t("onboardInstr"))}
              className="flex items-center gap-2 px-4 py-2 bg-cream rounded-full text-primary"
            >
              <Volume2 size={20} />
              <span>{t("listen")}</span>
            </button>

            <MicButton listening={listening} onClick={handleMic} size={96} />

            {transcript && (
              <div className="w-full max-w-lg bg-cream rounded-2xl p-4">
                <p className="font-nastaliq text-lg" dir="rtl">{transcript}</p>
              </div>
            )}

            {/* Skip to manual */}
            <button
              onClick={() => setPhase("confirm")}
              className="text-sm text-ink/50 underline"
            >
              {t("fillManually")}
            </button>
          </div>
        )}

        {phase === "confirm" && (
          <div className="max-w-lg mx-auto space-y-5">
            <h2 className="font-nastaliq text-xl font-semibold text-center" dir="rtl">{t("confirmProfile")}</h2>

            {aiFailed && (
              <div className="bg-amber/10 border border-amber/30 rounded-2xl p-3 text-sm text-ink/70">
                {t("aiOfflineNote")}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">{t("name")}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-card-border rounded-xl text-lg font-nastaliq"
                dir="rtl"
                placeholder={t("name")}
              />
            </div>

            {/* Trade */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-2">{t("trade")}</label>
              <TradeGrid selected={trade} onSelect={(t) => { setTrade(t); setRate(DEFAULT_RATES[t] || 1500); }} />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-2">{t("area")}</label>
              <div className="flex flex-wrap gap-2">
                {AREAS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setArea(a)}
                    className={`px-4 py-2 rounded-full border-2 text-sm font-semibold min-h-[44px] transition-colors ${
                      area === a ? "border-primary bg-primary/10 text-primary" : "border-card-border text-ink/60"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate stepper */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">{t("rate")} (Rs)</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setRate(Math.max(500, rate - 100))}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Minus size={24} />
                </button>
                <span className="text-2xl font-bold text-ink min-w-[100px] text-center">
                  Rs {rate.toLocaleString()}
                </span>
                <button
                  onClick={() => setRate(rate + 100)}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Experience stepper */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">{t("experience")}</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setExperience(Math.max(0, experience - 1))}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Minus size={24} />
                </button>
                <span className="text-2xl font-bold text-ink min-w-[80px] text-center">
                  {experience} {t("years")}
                </span>
                <button
                  onClick={() => setExperience(experience + 1)}
                  className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1">{t("phone")}</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-card-border rounded-xl text-lg"
                placeholder="03XX-XXXXXXX"
                type="tel"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors disabled:opacity-50"
            >
              {t("saveProfile")}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div className="py-6 space-y-6" dir={dir}>
      {/* Profile card */}
      {worker && (
        <div className="bg-white border border-card-border rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-primary font-bold text-2xl">
              {worker.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-nastaliq text-xl font-bold" dir="rtl">{worker.name}</h2>
              <span className="inline-block px-3 py-0.5 bg-cream text-primary text-sm rounded-full mt-1">
                {t(worker.trade)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-1"><MapPin size={14} className="text-ink/40" /><span>{worker.area}</span></div>
            <div className="flex items-center gap-1"><Star size={14} className="text-amber fill-amber" /><span>{Number(worker.rating).toFixed(1)}</span></div>
            <div className="flex items-center gap-1"><Briefcase size={14} className="text-ink/40" /><span>{worker.jobs_done} {t("jobsDone")}</span></div>
            <div className="font-bold">Rs {Number(worker.rate).toLocaleString()}</div>
          </div>
        </div>
      )}

      {/* Availability toggle */}
      <div className="flex items-center justify-between bg-white border border-card-border rounded-2xl shadow-sm p-5">
        <span className="font-nastaliq text-lg font-semibold" dir="rtl">{t("availability")}</span>
        <button
          onClick={toggleAvailability}
          className={`relative w-20 h-10 rounded-full transition-colors ${available ? "bg-green" : "bg-red"}`}
        >
          <span
            className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow transition-transform ${
              available ? "left-11" : "left-1"
            }`}
          />
          <span className="sr-only">{available ? t("available") : t("busy")}</span>
        </button>
        <span className={`text-sm font-semibold ${available ? "text-green" : "text-red"}`}>
          {available ? t("available") : t("busy")}
        </span>
      </div>

      {/* New job requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-nastaliq text-lg font-semibold" dir="rtl">{t("newRequests")}</h3>
          <button onClick={fetchDashboard} className="flex items-center gap-1 text-primary text-sm">
            <RefreshCw size={16} />
            {t("refresh")}
          </button>
        </div>

        {pendingJobs.length === 0 ? (
          <p className="text-ink/40 text-center py-6 font-nastaliq" dir="rtl">{t("noRequests")}</p>
        ) : (
          <div className="space-y-3">
            {pendingJobs.map((job) => (
              <div key={job.id} className="bg-white border border-card-border rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{job.customer_name}</span>
                  <span className="text-ink/50 flex items-center gap-1"><MapPin size={12} />{job.customer_area}</span>
                </div>
                <p className="font-nastaliq text-ink/80" dir="rtl">{job.problem}</p>
                <div className="text-lg font-bold text-primary">Rs {Number(job.price_offered).toLocaleString()}</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(job.id)}
                    className="flex-1 min-h-[56px] bg-green hover:bg-green/90 text-white text-lg font-semibold rounded-full"
                  >
                    {t("accept")}
                  </button>
                  <button
                    onClick={() => handleReject(job.id)}
                    className="flex-1 min-h-[56px] bg-red hover:bg-red/90 text-white text-lg font-semibold rounded-full"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active jobs */}
      <div>
        <h3 className="font-nastaliq text-lg font-semibold mb-3" dir="rtl">{t("activeJobs")}</h3>
        {activeJobs.length === 0 ? (
          <p className="text-ink/40 text-center py-6 font-nastaliq" dir="rtl">{t("noActiveJobs")}</p>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <div key={job.id} className="bg-white border border-card-border rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{job.customer_name}</span>
                  <span className="text-ink/50 flex items-center gap-1"><MapPin size={12} />{job.customer_area}</span>
                </div>
                <p className="font-nastaliq text-ink/80" dir="rtl">{job.problem}</p>
                <div className="text-lg font-bold text-primary">Rs {Number(job.price_offered).toLocaleString()}</div>
                <button
                  onClick={() => handleComplete(job.id)}
                  className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full"
                >
                  {t("jobDone")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
