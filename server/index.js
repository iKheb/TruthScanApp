import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import { DEFAULT_ANALYSIS_MODE_ID, getAnalysisModeConfig } from "../shared/analysisModes.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.ANALYSIS_API_PORT || 8788);
const provider = String(process.env.LLM_PROVIDER || "groq").toLowerCase();

app.use(cors());
app.use(express.json({ limit: "200kb" }));

const ALLOWED_FLAGS = [
  "Posible ghosting",
  "Posible gaslighting",
  "Baja reciprocidad emocional",
  "Manipulacion emocional potencial",
  "Senales emocionales mixtas",
];

function clamp(value, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizeFlags(flags) {
  if (!Array.isArray(flags)) return [];
  return flags
    .map((item) => String(item || "").trim())
    .filter((item) => ALLOWED_FLAGS.includes(item))
    .slice(0, 5);
}

function normalizeResult(payload, modeId) {
  return {
    interestScore: clamp(payload?.interestScore, 0, 100),
    honestyScore: clamp(payload?.honestyScore, 0, 100),
    emotionalTone: String(payload?.emotionalTone || "Ambiguo").slice(0, 160),
    manipulationFlags: normalizeFlags(payload?.manipulationFlags),
    verdict: String(payload?.verdict || "No se pudo generar un veredicto.").slice(0, 700),
    analysisMode: modeId,
  };
}

function normalizeRelationshipResult(payload) {
  const reciprocityLevel = clamp(payload?.reciprocityLevel, 0, 100);
  const interestScore = clamp(payload?.interestScore ?? reciprocityLevel, 0, 100);
  const redFlags = Array.isArray(payload?.redFlags)
    ? payload.redFlags.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
    : [];

  let badge = String(payload?.badge || "").trim();
  if (!badge) {
    if (reciprocityLevel >= 75) badge = "Interes mutuo";
    else if (reciprocityLevel >= 45) badge = "Zona de confusion";
    else badge = "Relacion desequilibrada";
  }

  return {
    diagnosis: String(payload?.diagnosis || "No se pudo generar un diagnostico claro.").slice(0, 900),
    reciprocityLevel,
    redFlags,
    interestScore,
    recommendation: String(payload?.recommendation || "Habla con claridad y evalua coherencia entre palabras y acciones.").slice(0, 400),
    badge,
    highlight: String(payload?.highlight || "Tu energia emocional merece reciprocidad real.").slice(0, 220),
    analysisMode: "modo_terapeuta",
  };
}

function buildPrompt(chatText, modeId) {
  const mode = getAnalysisModeConfig(modeId);

  return `Analiza la siguiente conversacion y responde SOLO JSON valido.

Objetivo:
- Detectar: ghosting, gaslighting, desinteres, manipulacion emocional, senales mixtas.

Personalidad seleccionada:
- ${mode.name}: ${mode.description}
- Instruccion de tono: ${mode.promptTone}

Reglas:
- interestScore y honestyScore: enteros 0-100.
- emotionalTone: frase corta en espanol (max 12 palabras), emocional y clara.
- manipulationFlags: solo etiquetas exactas de esta lista:
  1) Posible ghosting
  2) Posible gaslighting
  3) Baja reciprocidad emocional
  4) Manipulacion emocional potencial
  5) Senales emocionales mixtas
- verdict: 2 a 4 frases segun la personalidad seleccionada.
- verdict: humano, claro y util; evita lenguaje robotico.
- verdict: incluye 1 consejo concreto y realista para el siguiente paso.
- Si la evidencia es debil, usa pocos flags o ninguno.

JSON esperado:
{
  "interestScore": number,
  "honestyScore": number,
  "emotionalTone": string,
  "manipulationFlags": string[],
  "verdict": string
}

Conversacion:
"""
${chatText}
"""`;
}

function buildRelationshipPrompt(answersText) {
  return `Analiza este test guiado sobre dinamica de pareja y responde SOLO JSON valido.

Objetivo:
- Dar un diagnostico emocional humano, directo y empatico.
- Detectar reciprocidad, consistencia y red flags.

Reglas:
- reciprocityLevel e interestScore: enteros 0-100.
- diagnosis: 3-5 frases utiles y aterrizadas.
- redFlags: lista corta de alertas puntuales (si hay).
- recommendation: una recomendacion clara y accionable.
- badge: solo uno de:
  1) Interes mutuo
  2) Zona de confusion
  3) Relacion desequilibrada
- highlight: frase corta, compartible y memorable.
- No diagnostiques salud mental.
- No uses lenguaje ofensivo.

JSON esperado:
{
  "diagnosis": string,
  "reciprocityLevel": number,
  "redFlags": string[],
  "interestScore": number,
  "recommendation": string,
  "badge": string,
  "highlight": string
}

Respuestas del test:
"""
${answersText}
"""`;
}

function answersToText(answers) {
  if (!answers || typeof answers !== "object") return "";
  return Object.entries(answers)
    .map(([key, value]) => `${key}: ${String(value || "").trim()}`)
    .join("\n");
}

function getProviderConfig() {
  if (provider === "groq") {
    return {
      name: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    };
  }

  if (provider === "openai") {
    return {
      name: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  throw new Error(`Proveedor no soportado: ${provider}`);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider, service: "truthscan-local-ia-api" });
});

app.post("/analyze", async (req, res) => {
  try {
    const config = getProviderConfig();
    const apiKey = config.apiKey;

    if (!apiKey) {
      const keyName = config.name === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
      return res.status(500).json({ error: `${keyName} no configurada en .env.local` });
    }

    const text = String(req.body?.text || "").trim();
    const modeId = String(req.body?.mode || DEFAULT_ANALYSIS_MODE_ID);
    const mode = getAnalysisModeConfig(modeId);

    if (!text) {
      return res.status(400).json({ error: "Debes enviar texto para analizar." });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
    });

    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.2,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Eres un analista emocional experto. Adapta todo tu tono al modo seleccionado: ${mode.name}. ${mode.promptTone}. Basate en evidencia textual y no inventes hechos ni diagnostiques.`,
        },
        {
          role: "user",
          content: buildPrompt(text.slice(0, 6000), mode.id),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.json(normalizeResult(parsed, mode.id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al analizar.";
    return res.status(500).json({ error: message });
  }
});

app.post("/relationship-check", async (req, res) => {
  try {
    const config = getProviderConfig();
    const apiKey = config.apiKey;

    if (!apiKey) {
      const keyName = config.name === "groq" ? "GROQ_API_KEY" : "OPENAI_API_KEY";
      return res.status(500).json({ error: `${keyName} no configurada en .env.local` });
    }

    const answersText = answersToText(req.body?.answers);
    if (!answersText) {
      return res.status(400).json({ error: "Debes enviar respuestas del test." });
    }

    const client = new OpenAI({
      apiKey,
      baseURL: config.baseURL,
    });

    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.2,
      max_tokens: 420,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres un analista emocional experto en dinamicas de relacion. Habla con empatia, claridad y honestidad. Evita respuestas genericas y no diagnostiques.",
        },
        {
          role: "user",
          content: buildRelationshipPrompt(answersText.slice(0, 4000)),
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return res.json(normalizeRelationshipResult(parsed));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al analizar.";
    return res.status(500).json({ error: message });
  }
});

app.listen(port, () => {
  console.log(`TruthScan IA API (${provider}) lista en http://127.0.0.1:${port}`);
});
