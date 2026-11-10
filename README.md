# Roshan Rozgar — روشن روزگار

> **بولو، کام پاؤ** — Speak. Get Work.

A voice-first, two-sided web marketplace connecting households in Islamabad with nearby skilled trade workers (electricians, plumbers, AC technicians, carpenters, mechanics, painters). Workers have low literacy — no forms, no typing required.

**Live Demo:** https://roshan-rozgar.vercel.app/

**Figma:** [Design File](https://www.figma.com/design/HSRWB5fUje8dMmEpP2ImYo/Roshan-Rozgar-%E2%80%94-AI-Web-Forge?node-id=0-1&t=NmAlApLVAPjfm78A-1)

---

## The Problem

Millions of skilled trade workers in Pakistan's informal economy are locked out of digital platforms because those platforms require reading and typing. Today, a homeowner finds a plumber through word-of-mouth or by visiting an *adda* (roadside gathering spot). This is slow, unreliable, and offers no trust signals. Roshan Rozgar replaces that with a voice-driven marketplace where a worker creates a profile by **speaking Urdu** and a customer books by **speaking their problem**.

---

## How It Maps to the 5 Required Outcomes

| # | Outcome | Implementation |
|---|---------|---------------|
| 1 | **Voice Onboarding** | Worker speaks Urdu → Gemini extracts profile JSON → editable confirm card with icons/chips/stepper → save to Supabase |
| 2 | **Discovery** | Trade tiles OR spoken problem → Gemini detects trade + urgency → shows workers where `available=true`, filterable by trade + area, sorted by rating |
| 3 | **No-Typing Communication** | Voice notes (MediaRecorder, ≤20s, base64) + speech-to-text messages on the job page; AI "detect" turns spoken problems into trade + urgency |
| 4 | **Booking Consistency** | Creating a job sets `workers.available=false`; Accept keeps unavailable; Reject sets `available=true`; Complete sets `available=true` and `jobs_done+1` |
| 5 | **Trust** | Ratings only on completed jobs; worker rating recomputed as average of all reviews; AI "summarize" one-liner from reviews displayed on job page |

---

## Features by Role

### Worker (`/worker`)
- **Voice onboarding:** press the mic, speak your name/trade/area/experience in Urdu — AI extracts your profile, you confirm with big tap-friendly chips, done
- **Dashboard:** availability toggle (green/red), pending job requests with Accept/Reject buttons, active jobs with "Mark as Done" button
- **No typing anywhere** — every interaction is voice or a single tap

### Customer (`/customer`)
- **Setup:** name + area (one-time, stored in localStorage)
- **Find workers:** speak or type a problem → AI detects the trade + urgency → filtered worker grid (trade + area chips)
- **Book:** tap a worker → price stepper → confirm → navigates to job page
- **Rate:** after job completion, star rating (1–5) + optional spoken review

### Job Page (`/job/[id]`)
- **Status stepper:** Pending → Accepted → Completed (or Rejected message)
- **Voice notes chat:** text + audio bubbles, worker/customer sides distinguished
- **Trust panel:** latest reviews as quotes + AI-generated summary ("Customers say: ...")
- **Rating section:** stars + spoken comment + submit → worker rating recomputed

---

## AI Services

| Service | What It Does | What Breaks Without It |
|---------|-------------|----------------------|
| **Gemini API** (profile extraction) | Extracts name, trade, area, rate, experience from spoken Urdu | A worker who cannot type **cannot create a profile at all** — the app falls back to manual tap-only input |
| **Gemini API** (problem detection) | Detects trade + urgency from a customer's spoken problem | Customer must manually select a trade from the grid instead of speaking |
| **Gemini API** (review summary) | Generates a one-line Urdu summary of all reviews | Trust panel shows individual reviews but no summary line |
| **Web Speech API** (`webkitSpeechRecognition`) | Speech-to-text in `ur-PK` with `en-US` fallback | Voice input buttons stop working; user must type (Chrome only) |
| **Web Speech API** (`speechSynthesis`) | Read-aloud buttons for worker cards, instructions, confirmations | Read-aloud buttons become silent; no functional impact |
| **MediaRecorder API** | Records voice notes (≤20s) saved as base64 data URLs | Voice note recording fails; text messaging still works |

---

## Tech Stack

- **Framework:** Next.js (JavaScript, App Router, no TypeScript)
- **Styling:** Tailwind CSS + custom theme (orange #FF6B00 primary, Poppins + Noto Nastaliq Urdu fonts)
- **Components:** shadcn/ui (Button, Card, Badge, Input) + lucide-react icons
- **Database:** Supabase Postgres via `@supabase/supabase-js` (RLS disabled, anon key)
- **AI:** Google Gemini 2.0 Flash via server-side API route
- **Voice:** Web Speech API + MediaRecorder
- **Deploy:** Vercel

---

## Setup

```bash
git clone https://github.com/HashirMehmood1/roshan-rozgar.git
cd roshan-rozgar
npm install
```

Create `.env.local` with:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

```bash
npm run dev
```

---

## Database

Run this SQL in your Supabase SQL Editor to create the 4 tables:

```sql
-- Workers
CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trade TEXT NOT NULL CHECK (trade IN ('electrician','plumber','ac_technician','carpenter','mechanic','painter')),
  area TEXT NOT NULL CHECK (area IN ('G-9','F-11','I-8','H-12','G-13','F-7')),
  rate INTEGER NOT NULL DEFAULT 1500,
  experience_years INTEGER DEFAULT 3,
  phone TEXT,
  available BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0,
  jobs_done INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id),
  customer_name TEXT NOT NULL,
  customer_area TEXT NOT NULL,
  problem TEXT,
  trade TEXT,
  urgency TEXT DEFAULT 'normal',
  price_offered INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  sender TEXT NOT NULL CHECK (sender IN ('customer','worker')),
  kind TEXT DEFAULT 'text',
  text TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id),
  job_id UUID REFERENCES jobs(id),
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  customer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Seed Data

Insert 12 sample workers across 6 trades and 6 areas (see the Supabase dashboard for the seeded data). Sample reviews exist for the top-rated worker to demonstrate the trust panel.

---

## Seeded / Simulated Data Disclosure

This demo includes **12 sample workers** with simulated Pakistani names, trades, areas, rates, and ratings, plus **3 sample reviews** for Muhammad Akram (top-rated electrician). **ALL sample data is simulated for the demo** — no real workers or customers are represented. RLS (Row Level Security) is **disabled** on all tables for this hackathon demo.

---

## Limitations

- **Speech recognition requires Chrome** — the Web Speech API (`webkitSpeechRecognition`) is only fully supported in Chromium-based browsers
- **No payments** — price agreement is manual (Accept/Reject buttons); no payment gateway integrated
- **No SMS/push notifications** — worker must refresh to see new jobs
- **No GPS** — areas are manual chip selections from 6 Islamabad sectors (G-9, F-11, I-8, H-12, G-13, F-7)
- **Single-device demo** — identity is stored in `localStorage` (worker_id, customer_name, customer_area); no authentication system
- **No real-time updates** — job status requires manual refresh
- **Urdu speech recognition accuracy** varies by device and browser version

---

## Disclosure

Built solo by **Hashir Mehmood** for **CUI Tech Fest FA'26 — AI Web Forge**, 10 Nov 2026.

**AI coding assistants used:** Claude (Claude Pro) and ChatGPT (ChatGPT Pro).

**UI design** drafted with Claude Design and presented in Figma.

---

## Author

**Hashir Mehmood** — COMSATS University Islamabad
