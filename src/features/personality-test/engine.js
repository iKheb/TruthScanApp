import { PERSONALITY_PROFILES } from "./questions";

function createScoreMap() {
  return { analyst: 0, intense: 0, detector: 0, romantic: 0 };
}

export function resolvePersonalityProfile(answers, questions) {
  const score = createScoreMap();

  questions.forEach((question) => {
    const answerId = answers?.[question.id];
    const option = question.options.find((item) => item.id === answerId);
    if (!option) return;
    Object.entries(option.scores || {}).forEach(([key, value]) => {
      score[key] = (score[key] || 0) + Number(value || 0);
    });
  });

  const winner = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0] || "analyst";
  const profile = PERSONALITY_PROFILES[winner] || PERSONALITY_PROFILES.analyst;
  return { profile, score };
}

export function buildPersonalityShareText(profile) {
  return `La IA dijo que soy "${profile.name}" en relaciones. No esperaba este resultado.`;
}

export function createPersonalityImage(profile, appName = "TruthScan") {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#080A16");
  gradient.addColorStop(1, "#16183A");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);

  ctx.fillStyle = "rgba(108,92,231,0.28)";
  ctx.beginPath();
  ctx.arc(140, 150, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,209,255,0.2)";
  ctx.beginPath();
  ctx.arc(940, 220, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00D1FF";
  ctx.font = "700 44px Arial";
  ctx.fillText(appName, 70, 100);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 56px Arial";
  ctx.fillText("Mi perfil en relaciones", 70, 220);
  ctx.font = "700 52px Arial";
  ctx.fillText(profile.name, 70, 300);

  ctx.fillStyle = "#DDE5FF";
  ctx.font = "500 31px Arial";
  ctx.fillText(String(profile.description || "").slice(0, 80), 70, 390);

  ctx.fillStyle = "#EAF0FF";
  ctx.font = "600 36px Arial";
  ctx.fillText("Fortalezas", 70, 500);
  ctx.font = "500 29px Arial";
  (profile.strengths || []).slice(0, 3).forEach((item, idx) => {
    ctx.fillText(`• ${item}`, 80, 560 + idx * 52);
  });

  ctx.fillStyle = "#FF96AB";
  ctx.font = "600 36px Arial";
  ctx.fillText("Riesgos", 70, 780);
  ctx.fillStyle = "#FFE6EC";
  ctx.font = "500 29px Arial";
  (profile.risks || []).slice(0, 3).forEach((item, idx) => {
    ctx.fillText(`• ${item}`, 80, 840 + idx * 52);
  });

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 24px Arial";
  ctx.fillText(`Resultado generado por ${appName}`, 70, 1260);

  return canvas.toDataURL("image/png");
}
