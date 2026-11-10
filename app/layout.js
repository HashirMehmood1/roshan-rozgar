import "./globals.css";
import { LanguageProvider } from "@/lib/translations";
import LanguageSwitch from "@/components/LanguageSwitch";

export const metadata = {
  title: "Roshan Rozgar — روشن روزگار",
  description: "Voice-first marketplace for skilled trade workers in Islamabad",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ur" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <LanguageProvider>
          {/* Sticky Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-card-border">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-ink leading-tight">Roshan Rozgar</span>
                  <span className="font-nastaliq text-xs text-ink/70 leading-tight">روشن روزگار</span>
                </div>
              </div>
              <LanguageSwitch />
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
