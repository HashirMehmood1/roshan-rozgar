const GEMINI_KEY = (process.env.GEMINI_API_KEY || "").trim();
const OPENAI_KEY = (process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = (process.env.OPENAI_MODEL || "gpt-4o-mini").trim();

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

function fingerprint(key) {
  if (!key) return "EMPTY";
  const len = key.length;
  if (len < 8) return `${key.slice(0, 2)}... (length ${len})`;
  return `${key.slice(0, 4)}...${key.slice(-4)} (length ${len})`;
}

// ─── OpenAI call ───
async function callOpenAI(prompt, jsonMode) {
  const body = {
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 256,
  };
  if (jsonMode) body.response_format = { type: "json_object" };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// ─── Gemini call (single-shot gemini-3.8-flash on v1beta) ───
async function callGeminiOnce(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_KEY,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 256 },
    }),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// ─── Extract text from provider responses ───
function extractOpenAIText(body) {
  try {
    const data = JSON.parse(body);
    return data?.choices?.[0]?.message?.content || null;
  } catch { return null; }
}

function extractGeminiText(body) {
  try {
    const data = JSON.parse(body);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch { return null; }
}

// ─── Unified provider chain ───
async function callAI(prompt, task) {
  const jsonMode = task !== "summarize";
  let openaiErr = "OPENAI_KEY_MISSING";
  let geminiErr = "GEMINI_KEY_MISSING";

  // 1) Try OpenAI
  if (OPENAI_KEY) {
    try {
      const { status, body } = await callOpenAI(prompt, jsonMode);
      if (status >= 200 && status < 300) {
        const raw = extractOpenAIText(body);
        if (raw) return { ok: true, text: raw };
        openaiErr = `200 but empty content`;
      } else {
        openaiErr = `${status}: ${body.slice(0, 200)}`;
      }
    } catch (err) {
      openaiErr = `FETCH_ERROR: ${err.message}`;
    }
  }

  // 2) Fallback: Gemini 3.8-flash once
  if (GEMINI_KEY) {
    try {
      const { status, body } = await callGeminiOnce(prompt);
      if (status >= 200 && status < 300) {
        const raw = extractGeminiText(body);
        if (raw) return { ok: true, text: raw };
        geminiErr = `200 but empty content`;
      } else {
        geminiErr = `${status}: ${body.slice(0, 200)}`;
      }
    } catch (err) {
      geminiErr = `FETCH_ERROR: ${err.message}`;
    }
  }

  return { error: true, message: `AI_ALL_PROVIDERS_FAILED: OpenAI ${openaiErr} | Gemini ${geminiErr}` };
}

// ─── GET: debug endpoint ───
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("debug") !== "1") {
    return Response.json({ error: "pass ?debug=1" }, { status: 400 });
  }

  const report = {
    openaiKeyPresent: !!OPENAI_KEY,
    openaiKeyFingerprint: fingerprint(OPENAI_KEY),
    openaiModel: OPENAI_MODEL,
    geminiKeyPresent: !!GEMINI_KEY,
    geminiKeyFingerprint: fingerprint(GEMINI_KEY),
    attempts: [],
    verdict: "ALL_FAILED",
  };

  // Test OpenAI first
  if (OPENAI_KEY) {
    try {
      const { status, body } = await callOpenAI(
        'Reply ONLY with the JSON object: {"ok":true}', true
      );
      report.attempts.push({ provider: "openai", model: OPENAI_MODEL, status, snippet: body.slice(0, 300) });
      if (status === 200) {
        report.verdict = `OK openai/${OPENAI_MODEL}`;
        return Response.json(report);
      }
    } catch (err) {
      report.attempts.push({ provider: "openai", model: OPENAI_MODEL, status: 0, snippet: `FETCH_ERROR: ${err.message}` });
    }
  }

  // Fallback: test Gemini 3.8-flash
  if (GEMINI_KEY) {
    try {
      const { status, body } = await callGeminiOnce("Reply with the single word OK");
      report.attempts.push({ provider: "gemini", model: "gemini-3.8-flash", status, snippet: body.slice(0, 300) });
      if (status === 200) {
        report.verdict = "OK gemini/gemini-3.8-flash";
        return Response.json(report);
      }
    } catch (err) {
      report.attempts.push({ provider: "gemini", model: "gemini-3.8-flash", status: 0, snippet: `FETCH_ERROR: ${err.message}` });
    }
  }

  return Response.json(report);
}

// ─── POST: main AI route ───
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

    const result = await callAI(promptFn(text), task);

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
