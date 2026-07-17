import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, X, Eye } from "lucide-react";
import type { DocSlotDef, StagedFile } from "../types";
import { toPdfIfConvertible } from "../lib/pdf";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp"]);

export default function DocumentSlot({
  def,
  staged,
  onChange,
}: {
  def: DocSlotDef;
  staged: StagedFile | undefined;
  onChange: (file: StagedFile | undefined) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    if (staged?.file && IMAGE_TYPES.has(staged.file.type)) {
      const url = URL.createObjectURL(staged.file);
      setThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setThumbUrl(null);
  }, [staged?.file]);

  async function handleFile(file: File) {
    onChange({ file, status: "converting" });
    try {
      const { blob } = await toPdfIfConvertible(file);
      onChange({ file, status: "ready", pdfBlob: blob });
    } catch {
      onChange({ file, status: "error", errorMessage: "Couldn't process this file" });
    }
  }

  function openPreview() {
    if (!staged) return;
    const blob = staged.pdfBlob ?? staged.file;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <label className="block text-sm font-bold">
      {def.label}
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.webp,.docx,.txt,.doc,.rtf,.ppt,.pptx,.xls,.xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="mt-1.5 w-full cursor-pointer rounded-xl border border-dashed border-line bg-surface px-4 py-3 text-xs font-medium file:mr-3 file:rounded-full file:border-0 file:bg-doc file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white hover:border-study"
      />
      <span className="mt-1 block text-[11px] font-medium text-ink-soft">{def.hint}</span>
      {staged && (
        <span
          className={`mt-1 flex items-center gap-1.5 text-[11px] font-semibold ${
            staged.status === "error" ? "text-urgent" : staged.status === "ready" ? "text-success" : "text-study"
          }`}
        >
          {thumbUrl && <img src={thumbUrl} alt="" className="h-6 w-6 shrink-0 rounded-md border border-line object-cover" />}
          {staged.status === "converting" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />}
          {staged.status === "ready" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          {staged.status === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{staged.status === "error" ? staged.errorMessage : staged.file.name}</span>
          {staged.status !== "error" && (
            <button
              type="button"
              onClick={openPreview}
              aria-label={`Preview ${def.label}`}
              className="ml-auto shrink-0 rounded-lg p-0.5 text-study hover:bg-white"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${def.label}`}
            className={`shrink-0 rounded-lg p-0.5 text-ink-mute hover:bg-white ${staged.status === "error" ? "ml-auto" : ""}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </label>
  );
}
