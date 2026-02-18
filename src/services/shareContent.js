import { APP_NAME } from "../lib/appConfig";

export function buildShareText(analysis) {
  const flags = Array.isArray(analysis?.manipulationFlags) ? analysis.manipulationFlags : [];
  const flagsText = flags.length ? ` Alertas: ${flags.join(", ")}.` : "";
  return `La IA analizo mi chat y esto fue lo que descubrio... No esperaba este resultado. Interes: ${analysis?.interestScore ?? 0}/100, Honestidad: ${analysis?.honestyScore ?? 0}/100.${flagsText}`;
}

export function buildOgImageDataUri({ id, analysis, riskLabel }) {
  const safeVerdict = String(analysis?.verdict || "")
    .replace(/[<>&"]/g, "")
    .slice(0, 140);
  const safeTone = String(analysis?.emotionalTone || "Ambiguo")
    .replace(/[<>&"]/g, "")
    .slice(0, 80);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="#06060a"/>
<stop offset="100%" stop-color="#12122d"/>
</linearGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="210" cy="120" r="210" fill="#6C5CE7" fill-opacity="0.26"/>
<circle cx="980" cy="80" r="240" fill="#00D1FF" fill-opacity="0.2"/>
<text x="70" y="110" fill="#00D1FF" font-family="Arial,sans-serif" font-size="28" font-weight="700">${APP_NAME} Resultado #${id}</text>
<text x="70" y="190" fill="#F5F7FF" font-family="Arial,sans-serif" font-size="56" font-weight="700">La IA analizo mi chat</text>
<text x="70" y="245" fill="#D5DEF7" font-family="Arial,sans-serif" font-size="56" font-weight="700">y no esperaba esto...</text>
<text x="70" y="330" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="30">Interes: ${analysis?.interestScore ?? 0}/100</text>
<text x="420" y="330" fill="#FFFFFF" font-family="Arial,sans-serif" font-size="30">Honestidad: ${analysis?.honestyScore ?? 0}/100</text>
<text x="70" y="390" fill="#FF4D6D" font-family="Arial,sans-serif" font-size="28">${riskLabel || "Riesgo no definido"}</text>
<text x="70" y="455" fill="#C9D3F2" font-family="Arial,sans-serif" font-size="24">${safeTone}</text>
<text x="70" y="520" fill="#E5ECFF" font-family="Arial,sans-serif" font-size="22">${safeVerdict}</text>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function createResultImage(analysis, id, riskLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#090912");
  gradient.addColorStop(1, "#1C1C3D");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);

  ctx.fillStyle = "rgba(108,92,231,0.28)";
  ctx.beginPath();
  ctx.arc(160, 120, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,209,255,0.20)";
  ctx.beginPath();
  ctx.arc(1060, 180, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00D1FF";
  ctx.font = "700 46px Arial";
  ctx.fillText(APP_NAME, 70, 110);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 54px Arial";
  ctx.fillText("La IA analizo mi chat", 70, 210);
  ctx.fillText("y no esperaba esto...", 70, 280);

  ctx.font = "600 40px Arial";
  ctx.fillText(`Interes: ${analysis?.interestScore ?? 0}/100`, 70, 420);
  ctx.fillText(`Honestidad: ${analysis?.honestyScore ?? 0}/100`, 70, 490);

  ctx.fillStyle = "#FF4D6D";
  ctx.font = "700 36px Arial";
  ctx.fillText(riskLabel || "Riesgo no definido", 70, 580);

  ctx.fillStyle = "#DDE5FF";
  ctx.font = "500 30px Arial";
  ctx.fillText(`Tono: ${String(analysis?.emotionalTone || "Ambiguo").slice(0, 60)}`, 70, 650);

  ctx.fillStyle = "#EEF3FF";
  ctx.font = "500 28px Arial";
  const verdict = String(analysis?.verdict || "").slice(0, 160);
  ctx.fillText(verdict, 70, 740);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 24px Arial";
  ctx.fillText(`${APP_NAME} #${id}`, 70, 1110);

  return canvas.toDataURL("image/png");
}

export async function createResultImageBlob(analysis, id, riskLabel) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, "#090912");
  gradient.addColorStop(1, "#1C1C3D");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 1200);

  ctx.fillStyle = "rgba(108,92,231,0.28)";
  ctx.beginPath();
  ctx.arc(160, 120, 180, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,209,255,0.20)";
  ctx.beginPath();
  ctx.arc(1060, 180, 220, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#00D1FF";
  ctx.font = "700 46px Arial";
  ctx.fillText(APP_NAME, 70, 110);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 54px Arial";
  ctx.fillText("Resultado emocional", 70, 210);
  ctx.font = "600 40px Arial";
  ctx.fillText(`Compatibilidad: ${analysis?.interestScore ?? 0}%`, 70, 390);
  ctx.fillText(`Riesgo: ${riskLabel || "Indefinido"}`, 70, 460);
  ctx.fillStyle = "#DDE5FF";
  ctx.font = "500 31px Arial";
  ctx.fillText(String(analysis?.verdict || "").slice(0, 120), 70, 560);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 24px Arial";
  ctx.fillText(`@ ${APP_NAME} #${id}`, 70, 1110);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
