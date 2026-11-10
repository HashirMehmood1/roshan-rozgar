"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { useSpeech } from "@/hooks/useSpeech";
import { useVoiceNote } from "@/hooks/useVoiceNote";
import MicButton from "@/components/MicButton";
import StarRating from "@/components/StarRating";
import { MapPin, Star, Briefcase, RefreshCw, AlertTriangle, Send, Mic } from "lucide-react";

const STATUS_STEPS = ["pending", "accepted", "completed"];

export default function JobPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-ink/50">Loading...</div>}>
      <JobPageInner />
    </Suspense>
  );
}

function JobPageInner() {
  const { id } = useParams();
  const { t, dir, mounted } = useLanguage();
  const { startListening, speak } = useSpeech();
  const { isRecording, startRecording, stopRecording } = useVoiceNote();

  const [job, setJob] = useState(null);
  const [worker, setWorker] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [aiTrustLine, setAiTrustLine] = useState("");

  // Composer
  const [msgText, setMsgText] = useState("");
  const [listening, setListening] = useState(false);
  const [pendingAudio, setPendingAudio] = useState(null);

  // Review
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [existingReview, setExistingReview] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewListening, setReviewListening] = useState(false);

  // Viewer role
  const [viewerRole, setViewerRole] = useState("customer"); // customer | worker

  // Load job + worker + messages + reviews
  const loadAll = useCallback(async () => {
    if (!id) return;

    const { data: j } = await supabase.from("jobs").select("*").eq("id", id).single();
    if (!j) return;
    setJob(j);

    const { data: w } = await supabase.from("workers").select("*").eq("id", j.worker_id).single();
    if (w) setWorker(w);

    const { data: msgs } = await supabase
      .from("messages").select("*").eq("job_id", id)
      .order("created_at", { ascending: true });
    setMessages(msgs || []);

    // Reviews for this worker
    const { data: revs } = await supabase
      .from("reviews").select("*").eq("worker_id", j.worker_id)
      .order("created_at", { ascending: false }).limit(5);
    setReviews(revs || []);

    // Check for existing review for THIS job
    if (revs) {
      const mine = revs.find((r) => r.job_id === id);
      if (mine) setExistingReview(mine);
    }

    // AI trust summary if reviews exist
    if (revs && revs.length > 0) {
      const allComments = revs.map((r) => r.comment).filter(Boolean).join(". ");
      if (allComments) {
        try {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ task: "summarize", text: allComments }),
          });
          const data = await res.json();
          if (data.result && !data.error) setAiTrustLine(data.result);
        } catch { /* silent */ }
      }
    }
  }, [id]);

  useEffect(() => {
    if (!mounted) return;
    loadAll();
    // Determine viewer role
    const wid = localStorage.getItem("worker_id");
    // We'll set the role after job loads
    setViewerRole(wid ? "worker" : "customer");
  }, [mounted, loadAll]);

  // Refine viewer role once job loads
  useEffect(() => {
    if (!job) return;
    const wid = localStorage.getItem("worker_id");
    if (wid && wid === job.worker_id) {
      setViewerRole("worker");
    } else {
      setViewerRole("customer");
    }
  }, [job]);

  // Send text message
  const sendText = async () => {
    if (!msgText.trim()) return;
    await supabase.from("messages").insert({
      job_id: id,
      sender: viewerRole,
      kind: "text",
      text: msgText.trim(),
      audio_url: null,
    });
    setMsgText("");
    loadAll();
  };

  // Voice-to-text for composer
  const handleSpeechMic = () => {
    setListening(true);
    startListening((text) => {
      setListening(false);
      setMsgText(text);
    });
  };

  // Record voice note
  const handleVoiceRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording((base64) => {
        setPendingAudio(base64);
      });
    }
  };

  // Send voice note
  const sendVoice = async () => {
    if (!pendingAudio) return;
    await supabase.from("messages").insert({
      job_id: id,
      sender: viewerRole,
      kind: "voice",
      text: null,
      audio_url: pendingAudio,
    });
    setPendingAudio(null);
    loadAll();
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (reviewStars < 1 || !job) return;
    const custName = localStorage.getItem("customer_name") || "Customer";
    await supabase.from("reviews").insert({
      worker_id: job.worker_id,
      job_id: id,
      stars: reviewStars,
      comment: reviewComment || null,
      customer_name: custName,
    });

    // Recompute worker rating
    const { data: allRevs } = await supabase
      .from("reviews").select("stars").eq("worker_id", job.worker_id);
    if (allRevs && allRevs.length > 0) {
      const avg = allRevs.reduce((s, r) => s + r.stars, 0) / allRevs.length;
      await supabase.from("workers").update({ rating: Math.round(avg * 10) / 10 }).eq("id", job.worker_id);
    }

    speak(t("thankYouReview"));
    setReviewSubmitted(true);
    loadAll();
  };

  // Review speech-to-text
  const handleReviewMic = () => {
    setReviewListening(true);
    startListening((text) => {
      setReviewListening(false);
      setReviewComment(text);
    });
  };

  if (!mounted || !job) {
    return <div className="text-center py-20 text-ink/50">Loading...</div>;
  }

  const isRejected = job.status === "rejected";
  const stepIndex = STATUS_STEPS.indexOf(job.status);
  const isCustomer = viewerRole === "customer";
  const canReview = job.status === "completed" && isCustomer && !existingReview && !reviewSubmitted;

  return (
    <div className="py-6 space-y-6 max-w-3xl mx-auto" dir={dir}>
      {/* Header + refresh */}
      <div className="flex items-center justify-between">
        <h1 className="font-nastaliq text-2xl font-bold" dir="rtl">{t("jobDetails")}</h1>
        <button onClick={loadAll} className="flex items-center gap-1 text-primary text-sm">
          <RefreshCw size={16} />
          {t("refresh")}
        </button>
      </div>

      {/* Status stepper */}
      {isRejected ? (
        <div className="bg-red/10 border border-red rounded-2xl p-5 text-center">
          <p className="text-red font-semibold text-lg">{t("jobRejectedMsg")}</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {STATUS_STEPS.map((s, i) => {
            const active = i <= stepIndex;
            const key = s === "pending" ? "statusPending" : s === "accepted" ? "statusAccepted" : "statusCompleted";
            return (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  active ? "bg-primary text-white" : "bg-card-border text-ink/40"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs mt-1 ${active ? "text-primary font-semibold" : "text-ink/40"}`}>
                  {t(key)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Job info card */}
      <div className="bg-white border border-card-border rounded-2xl shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">Rs {Number(job.price_offered).toLocaleString()}</span>
          {job.urgency === "urgent" && (
            <span className="flex items-center gap-1 px-3 py-1 bg-red text-white text-sm font-semibold rounded-full">
              <AlertTriangle size={14} />
              {t("urgent")}
            </span>
          )}
        </div>
        <p className="font-nastaliq text-ink/80" dir="rtl">{job.problem}</p>
        <div className="flex items-center gap-2 text-sm text-ink/60">
          <MapPin size={14} />
          <span>{job.customer_name} · {job.customer_area}</span>
        </div>
      </div>

      {/* Worker mini-card */}
      {worker && (
        <div className="bg-white border border-card-border rounded-2xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-ink/50 mb-2">{t("workerInfo")}</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-primary font-bold text-lg">
              {worker.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-nastaliq font-bold text-lg" dir="rtl">{worker.name}</p>
              <span className="text-sm text-ink/60">{t(worker.trade)} · {worker.area}</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star size={14} className="text-amber fill-amber" />
                <span className="text-sm font-semibold">{Number(worker.rating).toFixed(1)}</span>
              </div>
              <span className="text-xs text-ink/40">{worker.jobs_done} {t("jobsDone")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Trust panel */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-nastaliq text-lg font-semibold" dir="rtl">{t("reviews")}</h3>
          {aiTrustLine && (
            <div className="bg-cream rounded-2xl p-4 border-l-4 border-primary">
              <p className="font-nastaliq font-semibold text-primary" dir="rtl">
                {t("customersSay")} {aiTrustLine}
              </p>
            </div>
          )}
          <div className="space-y-2">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="bg-white border border-card-border rounded-xl p-3 flex items-start gap-2">
                <StarRating value={r.stars} size={14} />
                <div className="flex-1">
                  {r.comment && <p className="font-nastaliq text-sm text-ink/70 italic" dir="rtl">"{r.comment}"</p>}
                  <span className="text-xs text-ink/40">{r.customer_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice notes chat */}
      <div className="space-y-3">
        <h3 className="font-nastaliq text-lg font-semibold" dir="rtl">{t("voiceNotes")}</h3>
        <div className="bg-cream rounded-2xl p-4 min-h-[120px] max-h-[400px] overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-ink/30 text-sm py-6">{t("noMessages") || "—"}</p>
          ) : (
            messages.map((m) => {
              const isMe = m.sender === viewerRole;
              return (
                <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe ? "bg-primary text-white" : "bg-white border border-card-border"
                  }`}>
                    <span className="text-[10px] opacity-60 block mb-1">
                      {m.sender === "worker" ? t("worker") : t("customer")}
                    </span>
                    {m.kind === "voice" && m.audio_url ? (
                      <audio controls src={m.audio_url} className="max-w-full" preload="none" />
                    ) : (
                      <p className="font-nastaliq text-sm" dir="rtl">{m.text}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Composer */}
        <div className="space-y-2">
          {/* Text row */}
          <div className="flex gap-2 items-center">
            <input
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendText()}
              className="flex-1 px-4 py-3 border border-card-border rounded-xl text-sm font-nastaliq"
              dir="rtl"
              placeholder={t("typeMessage")}
            />
            <MicButton listening={listening} onClick={handleSpeechMic} size={44} />
            <button
              onClick={sendText}
              disabled={!msgText.trim()}
              className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>

          {/* Voice note row */}
          <div className="flex gap-2 items-center">
            <button
              onClick={handleVoiceRecord}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold min-h-[44px] transition-colors ${
                isRecording ? "bg-red text-white animate-pulse" : "bg-cream text-primary"
              }`}
            >
              <Mic size={18} />
              {isRecording ? t("recording") : t("voiceNotes")}
            </button>
            {pendingAudio && (
              <>
                <audio controls src={pendingAudio} className="flex-1 max-w-[200px]" preload="none" />
                <button
                  onClick={sendVoice}
                  className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-full min-h-[44px]"
                >
                  {t("sendVoice")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating section */}
      {canReview && (
        <div className="bg-white border border-card-border rounded-2xl shadow-sm p-5 space-y-4">
          <h3 className="font-nastaliq text-xl font-bold text-center" dir="rtl">{t("rateThisWorker")}</h3>
          <div className="flex justify-center">
            <StarRating value={reviewStars} onChange={setReviewStars} size={40} />
          </div>
          <div className="flex gap-2 items-center">
            <input
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="flex-1 px-4 py-3 border border-card-border rounded-xl text-sm font-nastaliq"
              dir="rtl"
              placeholder={t("addComment")}
            />
            <MicButton listening={reviewListening} onClick={handleReviewMic} size={44} />
          </div>
          <button
            onClick={handleSubmitReview}
            disabled={reviewStars < 1}
            className="w-full min-h-[56px] bg-primary hover:bg-primary-dark text-white text-lg font-semibold rounded-full disabled:opacity-50"
          >
            {t("submitReview")}
          </button>
        </div>
      )}

      {/* Review submitted thank you */}
      {reviewSubmitted && (
        <div className="bg-green/10 border border-green rounded-2xl p-5 text-center">
          <p className="text-green font-semibold text-lg">{t("thankYouReview")}</p>
        </div>
      )}

      {/* Existing review display */}
      {existingReview && !reviewSubmitted && (
        <div className="bg-cream rounded-2xl p-5 text-center space-y-2">
          <p className="text-ink/70">{t("youRated")}</p>
          <div className="flex justify-center">
            <StarRating value={existingReview.stars} size={32} />
          </div>
          <p className="text-ink/60">{existingReview.stars} {t("stars")}</p>
        </div>
      )}
    </div>
  );
}
