import { summarizeRelationshipAnswers } from "../data/relationshipCheckQuestions";
import { API_URL, runConversationAnalysis } from "./analysisEngine";

function resolveRelationshipUrl(analyzeUrl) {
  const base = String(analyzeUrl || "").trim();
  if (!base) return "";
  return base.replace(/\/analyze$/, "/relationship-check");
}

function clampScore(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function buildBadge(reciprocityLevel) {
  if (reciprocityLevel >= 75) return "Interes mutuo";
  if (reciprocityLevel >= 45) return "Zona de confusion";
  return "Relacion desequilibrada";
}

function buildHighlight({ reciprocityLevel, redFlagsCount }) {
  if (reciprocityLevel < 45) {
    return "Estas invirtiendo mas energia emocional de la que recibes.";
  }
  if (redFlagsCount >= 2) {
    return "Hay quimica, pero tambien senales que no conviene ignorar.";
  }
  if (reciprocityLevel >= 75) {
    return "Se ve una dinamica mas reciproca y consistente.";
  }
  return "Hay potencial, pero aun falta claridad en la dinamica.";
}

function normalizeRelationshipResult(payload, fallbackMode = "modo_terapeuta") {
  const reciprocityLevel = clampScore(payload?.reciprocityLevel ?? payload?.interestScore ?? 0);
  const interestScore = clampScore(payload?.interestScore ?? reciprocityLevel);
  const redFlags = Array.isArray(payload?.redFlags)
    ? payload.redFlags.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 5)
    : [];

  const badge = String(payload?.badge || buildBadge(reciprocityLevel));
  const diagnosis = String(payload?.diagnosis || payload?.verdict || "No se pudo generar un diagnostico claro.").slice(0, 900);
  const recommendation = String(payload?.recommendation || "Habla con claridad sobre expectativas y observa si hay coherencia en acciones.").slice(0, 400);
  const highlight = String(payload?.highlight || buildHighlight({ reciprocityLevel, redFlagsCount: redFlags.length })).slice(0, 220);

  return {
    diagnosis,
    reciprocityLevel,
    redFlags,
    interestScore,
    recommendation,
    badge,
    highlight,
    analysisMode: String(payload?.analysisMode || fallbackMode),
  };
}

function mapFromConversationAnalysis(baseAnalysis) {
  const reciprocityLevel = clampScore((Number(baseAnalysis.interestScore || 0) + Number(baseAnalysis.honestyScore || 0)) / 2);
  const redFlags = Array.isArray(baseAnalysis.manipulationFlags) ? baseAnalysis.manipulationFlags : [];

  return normalizeRelationshipResult({
    diagnosis: baseAnalysis.verdict,
    reciprocityLevel,
    redFlags,
    interestScore: baseAnalysis.interestScore,
    recommendation: "Si buscas estabilidad, pide claridad concreta y evalua hechos, no promesas.",
    badge: buildBadge(reciprocityLevel),
    highlight: buildHighlight({ reciprocityLevel, redFlagsCount: redFlags.length }),
    analysisMode: baseAnalysis.analysisMode || "modo_terapeuta",
  });
}

export function buildRelationshipShareText(result) {
  return `La IA analizo mi relacion actual y salio ${result?.reciprocityLevel ?? 0}% de reciprocidad. ${result?.highlight || "No esperaba este resultado."}`;
}

export async function runRelationshipCheck(answers, questions) {
  const relationshipUrl = resolveRelationshipUrl(API_URL);
  const summary = summarizeRelationshipAnswers(answers, questions);

  if (!summary) {
    throw new Error("Debes completar el test antes de analizar.");
  }

  if (!relationshipUrl) {
    throw new Error("Configura VITE_OPENAI_ANALYSIS_API_URL con la URL de tu Worker.");
  }

  let response;
  try {
    response = await fetch(relationshipUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
  } catch {
    const fallback = await runConversationAnalysis(`Resumen del test de relacion:\n${summary}`, "modo_terapeuta");
    return { result: mapFromConversationAnalysis(fallback), sourceText: summary };
  }

  if (response.ok) {
    const payload = await response.json();
    if (typeof payload === "object" && payload) {
      if ("diagnosis" in payload || "reciprocityLevel" in payload || "redFlags" in payload) {
        return { result: normalizeRelationshipResult(payload), sourceText: summary };
      }
      if ("interestScore" in payload && "verdict" in payload) {
        return { result: mapFromConversationAnalysis(payload), sourceText: summary };
      }
    }
  }

  const fallback = await runConversationAnalysis(`Resumen del test de relacion:\n${summary}`, "modo_terapeuta");
  return { result: mapFromConversationAnalysis(fallback), sourceText: summary };
}
