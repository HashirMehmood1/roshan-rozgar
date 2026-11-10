"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/translations";
import { User, LogOut } from "lucide-react";

export default function HeaderAuth() {
  const { t, mounted } = useLanguage();
  const router = useRouter();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mounted) return;
    const id = localStorage.getItem("worker_id");
    if (!id) { setLoading(false); return; }

    supabase.from("workers").select("id, name").eq("id", id).single()
      .then(({ data }) => {
        if (data) setWorker(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [mounted]);

  const handleLogout = () => {
    localStorage.removeItem("worker_id");
    setWorker(null);
    window.location.reload();
  };

  if (loading || !mounted) return null;

  // Logged in: show first name + dashboard + logout
  if (worker) {
    const firstName = worker.name?.split(" ")[0] || worker.name;
    return (
      <div className="flex items-center gap-2">
        <a
          href="/worker"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cream rounded-full text-sm font-semibold text-ink hover:bg-primary/10 transition-colors"
        >
          <User size={16} className="text-primary" />
          <span className="hidden sm:inline">{firstName}</span>
          <span className="sm:hidden">{firstName?.charAt(0)}</span>
        </a>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-ink/60 hover:text-red hover:bg-red/10 transition-colors"
          title={t("logout")}
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{t("logout")}</span>
        </button>
      </div>
    );
  }

  // Not logged in: show Login button
  return (
    <a
      href="/login"
      className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-full transition-colors min-h-[36px]"
    >
      <User size={16} />
      {t("login")}
    </a>
  );
}
