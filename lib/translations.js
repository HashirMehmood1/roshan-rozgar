"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const strings = {
  // App
  tagline:            { ur: "بولو، کام پاؤ", roman: "Bolo, Kaam Pao", en: "Speak, Get Work Done" },
  heroHeadline:       { ur: "اسلام آباد کے بہترین کاریگر", roman: "Islamabad Ke Behtareen Karigar", en: "Islamabad's Best Skilled Workers" },
  heroSubhead:        { ur: "بولیں، بکنگ کریں، کام کروائیں", roman: "Bolein, Booking Karein, Kaam Karwaein", en: "Speak, Book, Get It Done" },
  worker:             { ur: "کاریگر", roman: "Karigar", en: "Worker" },
  customer:           { ur: "گاہک", roman: "Gahak", en: "Customer" },
  iAmWorker:          { ur: "میں کاریگر ہوں", roman: "Main Karigar Hoon", en: "I Am a Worker" },
  iNeedWorker:        { ur: "مجھے کاریگر چاہیے", roman: "Mujhe Karigar Chahiye", en: "I Need a Worker" },
  available:          { ur: "دستیاب", roman: "Dastiyab", en: "Available" },
  busy:               { ur: "مصروف", roman: "Masroof", en: "Busy" },
  book:               { ur: "بکنگ کریں", roman: "Booking Karein", en: "Book Now" },
  accept:             { ur: "قبول", roman: "Qabool", en: "Accept" },
  reject:             { ur: "انکار", roman: "Inkaar", en: "Reject" },
  completeJob:        { ur: "کام مکمل", roman: "Kaam Mukammal", en: "Complete Job" },
  perVisit:           { ur: "فی دورہ", roman: "Fi Daura", en: "per visit" },
  speakProblem:       { ur: "اپنا مسئلہ بولیں", roman: "Apna Masla Bolein", en: "Speak your problem" },
  save:               { ur: "محفوظ کریں", roman: "Mehfooz Karein", en: "Save" },
  myJobs:             { ur: "میرے کام", roman: "Mere Kaam", en: "My Jobs" },
  jobRequest:         { ur: "کام کی درخواست", roman: "Kaam Ki Darkhwast", en: "Job Request" },
  pending:            { ur: "زیر التوا", roman: "Zair-e-Iltwa", en: "Pending" },
  accepted:           { ur: "قبول شدہ", roman: "Qabool Shuda", en: "Accepted" },
  rejected:           { ur: "مسترد", roman: "Mustarad", en: "Rejected" },
  completed:          { ur: "مکمل", roman: "Mukammal", en: "Completed" },
  rateWorker:         { ur: "کاریگر کو ریٹ کریں", roman: "Karigar Ko Rate Karein", en: "Rate the Worker" },
  writeReview:        { ur: "اپنا تجربہ بتائیں", roman: "Apna Tajurba Batayein", en: "Share your experience" },
  rating:             { ur: "درجہ بندی", roman: "Darjabandi", en: "Rating" },
  jobsDone:           { ur: "مکمل کام", roman: "Mukammal Kaam", en: "Jobs Done" },
  listen:             { ur: "سنیں", roman: "Sunein", en: "Listen" },

  // How It Works
  howItWorks:         { ur: "یہ کیسے کام کرتا ہے؟", roman: "Yeh Kaise Kaam Karta Hai?", en: "How It Works?" },
  step1Title:         { ur: "بولیں", roman: "Bolein", en: "Speak" },
  step1Desc:          { ur: "اپنا مسئلہ اردو میں بولیں", roman: "Apna masla Urdu mein bolein", en: "Tell us your problem in Urdu" },
  step2Title:         { ur: "کاریگر چنیں", roman: "Karigar Chunein", en: "Choose Worker" },
  step2Desc:          { ur: "قریبی کاریگر دیکھیں اور بکنگ کریں", roman: "Qareebi karigar dekhein aur booking karein", en: "See nearby workers and book" },
  step3Title:         { ur: "کام کروائیں", roman: "Kaam Karwaein", en: "Get It Done" },
  step3Desc:          { ur: "کام مکمل ہونے پر ریٹنگ دیں", roman: "Kaam mukammal hone par rating dein", en: "Rate after job completion" },

  // Trades
  electrician:        { ur: "الیکٹریشن", roman: "Electrician", en: "Electrician" },
  plumber:            { ur: "پلمبر", roman: "Plumber", en: "Plumber" },
  ac_technician:      { ur: "اے سی ٹیکنیشن", roman: "AC Technician", en: "AC Technician" },
  carpenter:          { ur: "کارپینٹر", roman: "Carpenter", en: "Carpenter" },
  mechanic:           { ur: "مکینک", roman: "Mechanic", en: "Mechanic" },
  painter:            { ur: "پینٹر", roman: "Painter", en: "Painter" },

  // Areas
  "G-9":              { ur: "جی-۹", roman: "G-9", en: "G-9" },
  "F-11":             { ur: "ایف-۱۱", roman: "F-11", en: "F-11" },
  "I-8":              { ur: "آئی-۸", roman: "I-8", en: "I-8" },
  "H-12":             { ur: "ایچ-۱۲", roman: "H-12", en: "H-12" },
  "G-13":             { ur: "جی-۱۳", roman: "G-13", en: "G-13" },
  "F-7":              { ur: "ایف-۷", roman: "F-7", en: "F-7" },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("ur");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved && (saved === "ur" || saved === "roman" || saved === "en")) {
      setLangState(saved);
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    localStorage.setItem("lang", newLang);
  }, []);

  const t = useCallback((key) => {
    const entry = strings[key];
    if (!entry) return key;
    return entry[lang] || entry.en || key;
  }, [lang]);

  const dir = lang === "ur" ? "rtl" : "ltr";

  const speechLang = lang === "ur" ? "ur-PK" : "en-US";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, speechLang, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export default strings;
