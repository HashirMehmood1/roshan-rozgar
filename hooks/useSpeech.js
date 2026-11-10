"use client";
import { useRef, useCallback } from "react";
import { useLanguage } from "@/lib/translations";

export function useSpeech() {
  const { speechLang } = useLanguage();
  const recognitionRef = useRef(null);

  const startListening = useCallback((onResult) => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let retried = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      // One retry with English fallback
      if (!retried && speechLang !== "en-US") {
        retried = true;
        recognition.lang = "en-US";
        try { recognition.start(); } catch (e) { /* ignore */ }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
    }
  }, [speechLang]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
    }
  }, []);

  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    window.speechSynthesis.speak(utterance);
  }, [speechLang]);

  return { startListening, stopListening, speak };
}
