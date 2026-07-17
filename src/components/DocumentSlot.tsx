import { Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import type { DocSlotDef, StagedFile } from "../types";
import { toPdfIfConvertible } from "../lib/pdf";

export default function DocumentSlot({
  def,
  staged,
  onChange,
}: {
  def: DocSlotDef;
  staged: StagedFile | undefined;
  onChange: (file: StagedFile | undefined) => void;
}) {
  async function handleFile(file: File) {
    onChange({ file, status: "converting" });
    try {
      const { blob } = await toPdfIfConvertible(file);
      onChange({ file, status: "ready", pdfBlob: blob });
    } catch {
      onChange({ file, status: "error", errorMessage: "Couldn't process this file" });
    }
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
          {staged.status === "converting" && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />}
          {staged.status === "ready" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          {staged.status === "error" && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
          <span className="truncate">{staged.status === "error" ? staged.errorMessage : staged.file.name}</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${def.label}`}
            className="ml-auto shrink-0 rounded-lg p-0.5 text-ink-mute hover:bg-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </label>
  );
}
