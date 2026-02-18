import { Check, Copy, Download, Link2, MessageCircle, Send } from "lucide-react";
import { useState } from "react";
import { trackAnalyticsEvent } from "../services/analytics";
import { buildShareText, createResultImage, createResultImageBlob } from "../services/shareContent";

function ShareButton({ id, analysis, riskLabel }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  const shareUrl = `${window.location.origin}/result/${id}`;

  const onCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    trackAnalyticsEvent("result_shared", { channel: "copy_link", analysis_id: id });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onWhatsApp = () => {
    const text = buildShareText(analysis);
    const encoded = encodeURIComponent(`${text}\n\n${shareUrl}`);
    trackAnalyticsEvent("result_shared", { channel: "whatsapp", analysis_id: id });
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const onNativeShare = async () => {
    const text = buildShareText(analysis);
    if (!navigator.share) {
      await onCopyLink();
      return;
    }
    await navigator.share({ title: "Resultado TruthScan", text, url: shareUrl });
    trackAnalyticsEvent("result_shared", { channel: "native_share", analysis_id: id });
  };

  const onDownloadImage = () => {
    const imageData = createResultImage(analysis, id, riskLabel);
    if (!imageData) return;

    const anchor = document.createElement("a");
    anchor.href = imageData;
    anchor.download = `truthscan-result-${id}.png`;
    anchor.click();

    trackAnalyticsEvent("result_shared", { channel: "image_download", analysis_id: id });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onCopyImage = async () => {
    if (!window.ClipboardItem || !navigator.clipboard?.write) {
      onDownloadImage();
      return;
    }
    const blob = await createResultImageBlob(analysis, id, riskLabel);
    if (!blob) return;
    const item = new window.ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    trackAnalyticsEvent("result_shared", { channel: "image_copy", analysis_id: id });
    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 1500);
  };

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
      <button
        onClick={onWhatsApp}
        disabled={!id}
        className="glow-hover native-tap inline-flex items-center justify-center gap-2 rounded-2xl border border-[#25D366]/50 bg-[#25D366]/20 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:px-4"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button>

      <button
        onClick={onNativeShare}
        disabled={!id}
        className="glow-hover native-tap inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:px-4"
      >
        <Send className="h-4 w-4" />
        Compartir resultado
      </button>

      <button
        onClick={onDownloadImage}
        disabled={!id}
        className="glow-hover native-tap inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:px-4"
      >
        {saved ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {saved ? "Descargada" : "Descargar"}
      </button>

      <button
        onClick={onCopyImage}
        disabled={!id}
        className="glow-hover native-tap inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:px-4"
      >
        {copiedImage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copiedImage ? "Imagen copiada" : "Copiar imagen"}
      </button>

      <button
        onClick={onCopyLink}
        disabled={!id}
        className="cta-primary glow-hover native-tap col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:col-span-1"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Link copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}

export default ShareButton;
