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

  // Worker onboarding
  onboardTitle:       { ur: "اپنا تعارف بولیں", roman: "Apna Taaruf Bolein", en: "Speak Your Introduction" },
  onboardInstr:       { ur: "مائیک دبائیں اور اپنا نام، پیشہ، علاقہ اور تجربہ بتائیں", roman: "Mic dabayein aur apna naam, pesha, ilaqa aur tajurba batayein", en: "Press the mic and tell your name, trade, area and experience" },
  confirmProfile:     { ur: "اپنا پروفائل چیک کریں", roman: "Apna Profile Check Karein", en: "Confirm Your Profile" },
  saveProfile:        { ur: "پروفائل محفوظ کریں", roman: "Profile Mehfooz Karein", en: "Save My Profile" },
  profileSaved:       { ur: "پروفائل محفوظ ہو گیا!", roman: "Profile mehfooz ho gaya!", en: "Profile saved!" },
  name:               { ur: "نام", roman: "Naam", en: "Name" },
  trade:              { ur: "پیشہ", roman: "Pesha", en: "Trade" },
  area:               { ur: "علاقہ", roman: "Ilaqa", en: "Area" },
  rate:               { ur: "فیس", roman: "Fees", en: "Rate" },
  experience:         { ur: "تجربہ", roman: "Tajurba", en: "Experience" },
  years:              { ur: "سال", roman: "Saal", en: "years" },
  phone:              { ur: "فون نمبر", roman: "Phone Number", en: "Phone Number" },

  // Worker dashboard
  myProfile:          { ur: "میری پروفائل", roman: "Meri Profile", en: "My Profile" },
  availability:       { ur: "دستیابی", roman: "Dastiyabi", en: "Availability" },
  newRequests:        { ur: "نئی درخواستیں", roman: "Nayi Darkhwastain", en: "New Requests" },
  activeJobs:         { ur: "جاری کام", roman: "Jaari Kaam", en: "Active Jobs" },
  noRequests:         { ur: "کوئی نئی درخواست نہیں", roman: "Koi nayi darkhwast nahi", en: "No new requests" },
  noActiveJobs:       { ur: "کوئی جاری کام نہیں", roman: "Koi jaari kaam nahi", en: "No active jobs" },
  jobDone:            { ur: "کام مکمل کریں", roman: "Kaam Mukammal Karein", en: "Mark as Done" },
  offeredPrice:       { ur: "پیش کردہ قیمت", roman: "Paish Karda Qeemat", en: "Offered Price" },
  refresh:            { ur: "تازہ کریں", roman: "Taaza Karein", en: "Refresh" },
  problem:            { ur: "مسئلہ", roman: "Masla", en: "Problem" },
  customerName:       { ur: "گاہک کا نام", roman: "Gahak Ka Naam", en: "Customer Name" },
  customerArea:       { ur: "گاہک کا علاقہ", roman: "Gahak Ka Ilaqa", en: "Customer Area" },

  // Customer page
  findWorkers:        { ur: "کاریگر تلاش کریں", roman: "Karigar Talaash Karein", en: "Find Workers" },
  descProblem:        { ur: "اپنا مسئلہ لکھیں یا بولیں", roman: "Apna masla likhein ya bolein", en: "Type or speak your problem" },
  allTrades:          { ur: "سب", roman: "Sab", en: "All" },
  allAreas:           { ur: "سب علاقے", roman: "Sab Ilaqay", en: "All Areas" },
  noWorkers:          { ur: "کوئی کاریگر دستیاب نہیں", roman: "Koi karigar dastiyab nahi", en: "No workers available" },
  urgent:             { ur: "فوری", roman: "Fori", en: "Urgent" },
  normal:             { ur: "عام", roman: "Aam", en: "Normal" },
  confirmBooking:     { ur: "بکنگ کی تصدیق", roman: "Booking Ki Tasdeeq", en: "Confirm Booking" },
  priceOffered:       { ur: "پیش کردہ قیمت", roman: "Paish Karda Qeemat", en: "Price Offered" },
  confirmAndBook:     { ur: "تصدیق اور بکنگ کریں", roman: "Tasdeeq Aur Booking Karein", en: "Confirm & Book" },
  cancel:             { ur: "منسوخ", roman: "Mansookh", en: "Cancel" },
  bookingSuccess:     { ur: "بکنگ ہو گئی!", roman: "Booking ho gayi!", en: "Booking confirmed!" },
  setupName:          { ur: "اپنا نام بتائیں", roman: "Apna Naam Batayein", en: "Tell Us Your Name" },
  yourName:           { ur: "آپ کا نام", roman: "Aap Ka Naam", en: "Your Name" },
  yourArea:           { ur: "آپ کا علاقہ", roman: "Aap Ka Ilaqa", en: "Your Area" },
  continueBtn:        { ur: "آگے بڑھیں", roman: "Aagay Barhein", en: "Continue" },
  aiSummary:          { ur: "اے آئی خلاصہ", roman: "AI Khulasa", en: "AI Summary" },

  // Job page
  jobDetails:         { ur: "کام کی تفصیلات", roman: "Kaam Ki Tafseel", en: "Job Details" },
  statusPending:      { ur: "زیر التوا", roman: "Zair-e-Iltwa", en: "Pending" },
  statusAccepted:     { ur: "قبول شدہ", roman: "Qabool Shuda", en: "Accepted" },
  statusCompleted:    { ur: "مکمل", roman: "Mukammal", en: "Completed" },
  statusRejected:     { ur: "مسترد", roman: "Mustarad", en: "Rejected" },
  jobRejectedMsg:     { ur: "یہ کام مسترد ہو گیا", roman: "Yeh kaam mustarad ho gaya", en: "This job was rejected" },
  voiceNotes:         { ur: "وائس نوٹس", roman: "Voice Notes", en: "Voice Notes" },
  typeMessage:        { ur: "پیغام لکھیں", roman: "Paigham Likhein", en: "Type a message" },
  send:               { ur: "بھیجیں", roman: "Bhejein", en: "Send" },
  recording:          { ur: "ریکارڈنگ...", roman: "Recording...", en: "Recording..." },
  sendVoice:          { ur: "وائس بھیجیں", roman: "Voice Bhejein", en: "Send Voice" },
  customersSay:       { ur: "گاہک کہتے ہیں:", roman: "Gahak Kehte Hain:", en: "Customers say:" },
  reviews:            { ur: "جائزے", roman: "Jaizay", en: "Reviews" },
  rateThisWorker:     { ur: "اس کاریگر کو ریٹ کریں", roman: "Is Karigar Ko Rate Karein", en: "Rate This Worker" },
  addComment:         { ur: "تبصرہ شامل کریں", roman: "Tabsara Shamil Karein", en: "Add a comment (optional)" },
  submitReview:       { ur: "جائزہ جمع کریں", roman: "Jaiza Jama Karein", en: "Submit Review" },
  thankYouReview:     { ur: "شکریہ! آپ کا جائزہ محفوظ ہو گیا", roman: "Shukriya! Aapka jaiza mehfooz ho gaya", en: "Thank you! Your review has been saved" },
  youRated:           { ur: "آپ نے ریٹ کیا", roman: "Aap Ne Rate Kiya", en: "You rated" },
  stars:              { ur: "ستارے", roman: "Sitaray", en: "stars" },
  workerInfo:         { ur: "کاریگر کی معلومات", roman: "Karigar Ki Maloomat", en: "Worker Info" },

  // Landing page
  searchPlaceholder:  { ur: "اپنا مسئلہ بتائیں...", roman: "Apna masla batayein...", en: "Describe your problem..." },
  topWorkers:         { ur: "بہترین کاریگر", roman: "Behtareen Karigar", en: "Top Workers" },
  workerCta:          { ur: "آپ کاریگر ہیں؟ ابھی رجسٹر کریں", roman: "Aap karigar hain? Abhi register karein", en: "Are you a worker? Register now" },
  workerCtaSub:       { ur: "بولیں اور اپنا پروفائل بنائیں — لکھنے کی ضرورت نہیں", roman: "Bolein aur apna profile banayein — likhne ki zaroorat nahi", en: "Speak and create your profile — no typing needed" },
  registerNow:        { ur: "ابھی رجسٹر کریں", roman: "Abhi Register Karein", en: "Register Now" },
  footerTagline:      { ur: "اسلام آباد کا بھروسہ مند کاریگر پلیٹ فارم", roman: "Islamabad ka bharosa mand karigar platform", en: "Islamabad's trusted worker platform" },
  exChip1:            { ur: "بجلی کا مسئلہ", roman: "Bijli ka masla", en: "Electrical problem" },
  exChip2:            { ur: "نل ٹپک رہا ہے", roman: "Nal tapak raha hai", en: "Leaking tap" },
  exChip3:            { ur: "اے سی ٹھنڈا نہیں", roman: "AC thanda nahi", en: "AC not cooling" },
  trustedBy:          { ur: "بھروسہ مند", roman: "Bharosa Mand", en: "Trusted" },
  voiceFirst:         { ur: "آواز سے چلائیں", roman: "Awaaz Se Chalayein", en: "Voice First" },
  noTyping:           { ur: "لکھنے کی ضرورت نہیں", roman: "Likhne Ki Zaroorat Nahi", en: "No Typing Needed" },
  heroTitle:          { ur: "اسلام آباد کے بہترین کاریگر", roman: "Islamabad Ke Behtareen Karigar", en: "Islamabad's Best Skilled Workers" },
  heroSubtitle:       { ur: "بولیں، بکنگ کریں، کام کروائیں", roman: "Bolein, Booking Karein, Kaam Karwaein", en: "Speak, Book, Get It Done" },
  noMessages:         { ur: "ابھی کوئی پیغام نہیں", roman: "Abhi koi paigham nahi", en: "No messages yet" },
  fillManually:       { ur: "دستی طور پر بھریں", roman: "Dasti tor par bharein", en: "Fill manually" },
  searching:          { ur: "تلاش ہو رہی ہے...", roman: "Talaash ho rahi hai...", en: "Searching..." },
  aiOfflineNote:      { ur: "⚠️ AI دستیاب نہیں — کلیدی الفاظ سے ملایا گیا", roman: "⚠️ AI dastiyab nahi — keywords se milaya gaya", en: "⚠️ AI unavailable — matched by keywords" },
  typeFirst:          { ur: "پہلے مسئلہ لکھیں یا بولیں", roman: "Pehle masla likhein ya bolein", en: "Please describe your problem first" },
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
