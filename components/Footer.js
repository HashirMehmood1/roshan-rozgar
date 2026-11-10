"use client";
import { useLanguage } from "@/lib/translations";
import { Phone, MessageCircle, Home, Search, Wrench, LogIn, Shield, Star, Mic } from "lucide-react";

export default function Footer() {
  const { t, dir } = useLanguage();

  return (
    <footer className="relative bg-[#111111] text-white" dir={dir}>
      {/* Orange gradient hairline */}
      <div className="h-1 bg-gradient-to-r from-[#FF6B00] via-[#E85D00] to-[#FF6B00]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1: Logo + tagline + contact buttons */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Roshan Rozgar" className="w-10 h-10 rounded-xl" />
              <div>
                <span className="block text-base font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Roshan Rozgar
                </span>
                <span className="block font-nastaliq text-white/60 text-sm leading-relaxed">روشن روزگار</span>
              </div>
            </div>
            <p className="font-nastaliq text-white/50 text-sm leading-[2]" dir="rtl">
              {t("footerTagline")}
            </p>
            <div className="flex gap-3">
              <a
                href="tel:+923001234567"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                <Phone size={16} />
                <span>Call</span>
              </a>
              <a
                href="https://wa.me/923001234567"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-colors text-sm text-[#25D366]"
              >
                <MessageCircle size={16} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">Quick Links</h4>
            <nav className="flex flex-col gap-2.5">
              <a href="/" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Home size={14} /> {t("heroTitle").split(" ")[0] || "Home"}
              </a>
              <a href="/customer" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Search size={14} /> {t("findWorkers")}
              </a>
              <a href="/worker" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Wrench size={14} /> {t("registerNow")}
              </a>
              <a href="/login" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <LogIn size={14} /> {t("login")}
              </a>
            </nav>
          </div>

          {/* Col 3: Trust */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">{t("trustedBy")}</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Shield size={16} className="text-[#FF6B00]" />
                <span>{t("trustedBy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Mic size={16} className="text-[#FF6B00]" />
                <span>{t("voiceFirst")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Star size={16} className="text-[#FF6B00]" />
                <span>{t("noTyping")}</span>
              </div>
            </div>
          </div>

          {/* Col 4: Trades served */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/40">{t("allTrades")}</h4>
            <div className="flex flex-wrap gap-2">
              {["electrician", "plumber", "ac_technician", "carpenter", "mechanic", "painter"].map((tr) => (
                <span key={tr} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white/60">
                  {t(tr)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <span>© 2026 Roshan Rozgar</span>
          <span>Built by Hashir Mehmood — CUI Tech Fest FA&apos;26 · AI Web Forge</span>
        </div>
      </div>
    </footer>
  );
}
