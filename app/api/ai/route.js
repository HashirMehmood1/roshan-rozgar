const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-1.5-flash"];

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
  s = s.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  return s.trim();
}

function extractFirstJson(str) {
  const match = str.match(/\{[\s\S]*?\}/);
  return match ? match[0] : null;
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    return { error: true, message: "GEMINI_API_KEY not set" };
  }

  let lastStatus = 0;
  let lastBody = "";

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
        }),
      });

      lastStatus = res.status;

      // 401/403/429 → stop immediately, no point trying other models
      if (res.status === 401 || res.status === 403 || res.status === 429) {
        lastBody = await res.text().catch(() => "");
        return { error: true, message: `Gemini ${res.status}: ${lastBody.slice(0, 200)}` };
      }

      // 404/400 → model unavailable, try next
      if (res.status === 404 || res.status === 400) {
        lastBody = await res.text().catch(() => "");
        continue;
      }

      if (!res.ok) {
        lastBody = await res.text().catch(() => "");
        continue;
      }

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) continue;

      return { ok: true, text: raw };
    } catch {
      continue;
    }
  }

  return { error: true, message: `ALL_MODELS_FAILED last=${lastStatus}: ${lastBody.slice(0, 200)}` };
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

    const result = await callGemini(promptFn(text));

    if (result.error) {
      return Response.json({ error: true, message: result.message }, { status: 500 });
    }

    // For summarize task, return text directly
    if (task === "summarize") {
      return Response.json({ result: stripCodeFences(result.text) });
    }

    // For profile and detect, parse JSON with regex fallback
    const cleaned = stripCodeFences(result.text);
    try {
      const parsed = JSON.parse(cleaned);
      return Response.json({ result: parsed });
    } catch {
      // Regex fallback: extract first {...} block
      const jsonStr = extractFirstJson(cleaned);
      if (jsonStr) {
        try {
          const parsed = JSON.parse(jsonStr);
          return Response.json({ result: parsed });
        } catch {
          return Response.json({ error: true, message: "JSON parse failed after regex" }, { status: 500 });
        }
      }
      return Response.json({ error: true, message: "no JSON in response" }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: true, message: err.message || "AI error" }, { status: 500 });
  }
}
