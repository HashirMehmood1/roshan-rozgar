import "./globals.css";
import { LanguageProvider } from "@/lib/translations";
import LanguageSwitch from "@/components/LanguageSwitch";
import HeaderAuth from "@/components/HeaderAuth";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Roshan Rozgar — روشن روزگار",
  description: "Voice-first marketplace for skilled trade workers in Islamabad",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ur" className="scroll-smooth antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#111111] antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>
        <LanguageProvider>
          {/* Sticky Header */}
          <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-card-border">
            <div className="mx-auto w-full max-w-7xl flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
              <a href="/" className="flex items-center gap-3">
                <img src="/logo.png" alt="Roshan Rozgar" className="w-10 h-10 rounded-xl shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-ink leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Roshan Rozgar</span>
                  <span className="font-nastaliq text-xs text-ink/70 leading-tight">روشن روزگار</span>
                </div>
              </a>
              <div className="flex items-center gap-2">
                <LanguageSwitch />
                <HeaderAuth />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>

          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
