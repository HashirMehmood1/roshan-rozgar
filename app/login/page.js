"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import MicButton from "@/components/MicButton";
import { Phone, Lock, User, MapPin, Wrench, Briefcase, Volume2, VolumeX } from "lucide-react";

const TRADES = ["electrician", "plumber", "ac_technician", "carpenter", "mechanic", "painter"];
const AREAS = ["G-9", "F-11", "I-8", "H-12", "G-13", "F-7"];
const DEFAULT_RATES = {
  electrician: 1500, plumber: 1200, ac_technician: 2000,
  carpenter: 1800, mechanic: 1500, painter: 2500,
};

export default function LoginPage() {
  const { t, dir, lang } = useLanguage();
  const { startListening, stopListening, speak } = useSpeech();
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listeningSignup, setListeningSignup] = useState(false);
  const [listeningLogin, setListeningLogin] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);

  // Guidance state
  const [guidanceOn, setGuidanceOn] = useState(true);
  const spokenRef = useRef(new Set());
  const audioRef = useRef(null);

  const guide = useCallback((key) => {
    if (!guidanceOn) return;
    if (spokenRef.current.has(key)) return;
    spokenRef.current.add(key);

    // Stop any current audio/speech
    if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    if (lang === "ur") {
      // Try MP3 first, fall back to TTS
      const audio = new Audio("/audio/guidance/" + key + ".mp3");
      audioRef.current = audio;
      audio.play().catch(() => {
        // MP3 missing or error — fall back to speechSynthesis
        speak(t(key));
      });
    } else {
      speak(t(key));
    }
  }, [guidanceOn, lang, speak, t]);

  const toggleGuidance = () => {
    setGuidanceOn((prev) => {
      if (prev) {
        // Turning OFF — pause audio, cancel speech, clear spoken set
        if (audioRef.current) { try { audioRef.current.pause(); } catch {} }
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        spokenRef.current.clear();
      }
      return !prev;
    });
  };

  // Login fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPin, setLoginPin] = useState("");

  // Signup fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [trade, setTrade] = useState("electrician");
  const [area, setArea] = useState("G-9");
  const [rate, setRate] = useState(1500);
  const [experience, setExperience] = useState(3);

  // Urdu/Arabic-Indic digit normalization
  const normalizeDigits = (str) =>
    str.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
       .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());

  // Extract phone from spoken text
  const extractPhone = (text) => {
    let normalized = normalizeDigits(text).replace(/[^0-9]/g, "");
    // leading 92 → 0 (international format)
    if (normalized.startsWith("92") && normalized.length >= 12) {
      normalized = "0" + normalized.slice(2);
    }
    const match = normalized.match(/(03\d{9})/);
    return match ? match[1] : null;
  };

  // Signup voice: speak profile → AI extract → prefill
  const handleSignupVoice = () => {
    if (listeningSignup) { stopListening(); setListeningSignup(false); return; }
    setAiFailed(false);
    setListeningSignup(true);
    startListening(async (transcript) => {
      setListeningSignup(false);
      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: "profile", text: transcript }),
        });
        const data = await res.json();
        if (data.error) {
          setAiFailed(true);
        } else {
          if (data.name) setName(data.name);
          if (TRADES.includes(data.trade)) { setTrade(data.trade); setRate(DEFAULT_RATES[data.trade] || 1500); }
          if (AREAS.includes(data.area)) setArea(data.area);
          if (data.rate) setRate(Number(data.rate));
          if (data.experience_years) setExperience(Number(data.experience_years));
        }
      } catch {
        setAiFailed(true);
      }
    });
  };

  // Login voice: speak phone number
  const handleLoginVoice = () => {
    if (listeningLogin) { stopListening(); setListeningLogin(false); return; }
    setListeningLogin(true);
    startListening((transcript) => {
      setListeningLogin(false);
      const ph = extractPhone(transcript);
      if (ph) {
        setLoginPhone(ph);
      } else {
        setError(t("voicePhoneError"));
        guide("voicePhoneError");
      }
    });
  };

  const handleLogin = async () => {
    setError("");
    if (!loginPhone.trim() || !loginPin.trim()) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("workers")
        .select("*")
        .eq("phone", loginPhone.trim())
        .eq("pin", loginPin.trim())
        .single();
      if (data && !err) {
        localStorage.setItem("worker_id", data.id);
        router.push("/worker");
      } else {
        setError(t("wrongCredentials"));
      }
    } catch {
      setError(t("wrongCredentials"));
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setError("");
    if (!name.trim() || !phone.trim() || pin.length !== 4) return;
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("workers")
        .select("id")
        .eq("phone", phone.trim())
        .maybeSingle();
      if (existing) {
        setError(t("phoneAlreadyExists"));
        setLoading(false);
        return;
      }
      const { data, error: err } = await supabase.from("workers").insert({
        name: name.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
        trade,
        area,
        rate,
        experience_years: experience,
        available: true,
        rating: 5.0,
        jobs_done: 0,
      }).select().single();
      if (data && !err) {
        localStorage.setItem("worker_id", data.id);
        router.push("/worker");
      } else {
        setError(err?.message || "Error");
      }
    } catch (e) {
      setError(e.message || "Error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-start justify-center pt-8" dir={dir}>
      {/* Background image + overlay */}
      <div className="fixed inset-0 -z-10">
        <img src="/hero-bg.jpg" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#FFF7ED]/80 backdrop-blur-sm" />
      </div>

      <div className="w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Roshan Rozgar" className="w-[72px] h-[72px] rounded-2xl shadow-lg" />
          <h1 className="text-xl font-extrabold text-ink mt-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Roshan Rozgar
          </h1>
          <span className="font-nastaliq text-ink/60 text-sm">روشن روزگار</span>
        </div>

        {/* Card */}
        <div className="relative bg-white rounded-3xl shadow-xl p-6 space-y-5">
          {/* Guidance toggle — top corner */}
          <button
            onClick={toggleGuidance}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-cream transition-colors"
            aria-label={t("voiceGuide")}
            title={t("voiceGuide")}
          >
            {guidanceOn
              ? <Volume2 size={20} className="text-primary" />
              : <VolumeX size={20} className="text-ink/40" />
            }
          </button>

          {/* Tabs */}
          <div className="flex rounded-full bg-cream p-1">
            <button
              onClick={() => { setTab("login"); setError(""); guide("loginGuide"); }}
              className={`flex-1 py-3 rounded-full text-base font-semibold transition-colors ${
                tab === "login" ? "bg-primary text-white" : "text-ink/60"
              }`}
            >
              {t("login")}
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); guide("signupGuide"); }}
              className={`flex-1 py-3 rounded-full text-base font-semibold transition-colors ${
                tab === "signup" ? "bg-primary text-white" : "text-ink/60"
              }`}
            >
              {t("signup")}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red/10 border border-red/30 rounded-xl p-3 text-red text-sm font-nastaliq text-center" dir="rtl">
              {error}
            </div>
          )}

          {/* AI offline banner */}
          {aiFailed && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-amber-800 text-sm font-nastaliq text-center" dir="rtl">
              {t("aiOfflineNote")}
            </div>
          )}

          {/* ─── LOGIN TAB ─── */}
          {tab === "login" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("phone")}</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      onFocus={() => guide("askPhone")}
                      placeholder="03XX-XXXXXXX"
                      className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg focus:border-primary outline-none"
                    />
                  </div>
                  <MicButton listening={listeningLogin} onClick={handleLoginVoice} size={56} />
                </div>
                <p className="text-xs text-ink/50 mt-1 font-nastaliq" dir="rtl">{t("speakPhone")}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("pin")}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ""))}
                    onFocus={() => guide("askPin")}
                    placeholder="● ● ● ●"
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg tracking-[0.5em] text-center focus:border-primary outline-none"
                  />
                </div>
                <p className="text-xs text-ink/50 mt-1 font-nastaliq" dir="rtl">{t("pinPrivateNote")}</p>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading || !loginPhone.trim() || loginPin.length !== 4}
                className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("loginBtn")}
              </button>
            </div>
          )}

          {/* ─── SIGNUP TAB ─── */}
          {tab === "signup" && (
            <div className="space-y-4">
              {/* Voice profile input */}
              <div className="flex flex-col items-center gap-2 py-2">
                <MicButton listening={listeningSignup} onClick={handleSignupVoice} size={72} />
                <p className="text-sm text-ink/60 font-nastaliq text-center" dir="rtl">{t("speakProfile")}</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("name")}</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => guide("askName")}
                    placeholder={t("name")}
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg font-nastaliq focus:border-primary outline-none"
                    dir="rtl"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("phone")}</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onFocus={() => guide("askPhone")}
                    placeholder="03XX-XXXXXXX"
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("pin")}</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    onFocus={() => guide("askPin")}
                    placeholder="● ● ● ●"
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg tracking-[0.5em] text-center focus:border-primary outline-none"
                  />
                </div>
                <p className="text-xs text-ink/50 mt-1 font-nastaliq" dir="rtl">{t("pinPrivateNote")}</p>
              </div>

              {/* Trade */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("trade")}</label>
                <div className="relative">
                  <Wrench size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <select
                    value={trade}
                    onChange={(e) => { setTrade(e.target.value); setRate(DEFAULT_RATES[e.target.value] || 1500); }}
                    onFocus={() => guide("askTrade")}
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg bg-white focus:border-primary outline-none appearance-none"
                  >
                    {TRADES.map((tr) => (
                      <option key={tr} value={tr}>{t(tr)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("area")}</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    onFocus={() => guide("askArea")}
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg bg-white focus:border-primary outline-none appearance-none"
                  >
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("rate")} (Rs)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 font-bold text-sm">Rs</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                    onFocus={() => guide("askRate")}
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1">{t("experience")} ({t("years")})</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={experience}
                    onChange={(e) => setExperience(Number(e.target.value) || 0)}
                    onFocus={() => guide("askExperience")}
                    className="w-full min-h-[56px] pl-12 pr-4 border-2 border-card-border rounded-xl text-lg focus:border-primary outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSignup}
                disabled={loading || !name.trim() || !phone.trim() || pin.length !== 4}
                className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full transition-colors disabled:opacity-50"
              >
                {loading ? "..." : t("signupBtn")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
