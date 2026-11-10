const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const TRADES = ["electrician", "plumber", "ac_technician", "carpenter", "mechanic", "painter"];
const AREAS = ["G-9", "F-11", "I-8", "H-12", "G-13", "F-7"];

const PROMPTS = {
  profile: (text) =>
    `You are a data extractor for a skilled-worker marketplace in Islamabad, Pakistan. The user spoke in Urdu/Roman Urdu/English to describe themselves as a worker. Extract their profile.

Reply ONLY with a valid JSON object, no markdown, no explanation:
{"name": "string", "trade": "one of: ${TRADES.join("|")}", "area": "one of: ${AREAS.join("|")}", "rate": number_in_PKR, "experience_years": number}

If a field is unclear, guess sensibly:
- rate defaults: electrician 1500, plumber 1200, ac_technician 2000, carpenter 1800, mechanic 1500, painter 2500
- experience_years default: 3
- area default: G-9
- trade: pick the closest match from the list

User said: "${text}"`,

  detect: (text) =>
    `You detect what trade service a customer needs from their spoken problem description (Urdu/Roman Urdu/English).

Reply ONLY with a valid JSON object, no markdown, no explanation:
{"trade": "one of: ${TRADES.join("|")}", "urgency": "urgent or normal", "summary": "one short line in the same language as input"}

User said: "${text}"`,

  summarize: (text) =>
    `Summarize these customer reviews of a worker into ONE line, max 15 words, in Roman Urdu. Be positive and natural.

Reviews: "${text}"`,
};

function stripCodeFences(str) {
  let s = str.trim();
  // Remove ```json ... ``` or ``` ... ```
  s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return s.trim();
}

export async function POST(request) {
  try {
    const { task, text } = await request.json();

    if (!task || !text) {
      return Response.json({ error: true, message: "task and text required" }, { status: 400 });
    }

    const promptFn = PROMPTS[task];
    if (!promptFn) {
      return Response.json({ error: true, message: "unknown task" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return Response.json({ error: true, message: "GEMINI_API_KEY not set" }, { status: 500 });
    }

    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptFn(text) }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return Response.json({ error: true, message: `Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return Response.json({ error: true, message: "empty Gemini response" }, { status: 500 });
    }

    // For summarize task, return the text directly
    if (task === "summarize") {
      return Response.json({ result: stripCodeFences(raw) });
    }

    // For profile and detect, parse JSON
    const cleaned = stripCodeFences(raw);
    const parsed = JSON.parse(cleaned);
    return Response.json({ result: parsed });
  } catch (err) {
    return Response.json({ error: true, message: err.message || "AI error" }, { status: 500 });
  }
}
