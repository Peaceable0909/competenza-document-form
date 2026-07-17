import { useCallback, useRef, useState } from "react";
import { FileText, UploadCloud, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { DOCUMENT_TYPES, type DocumentType, type StagedFile } from "../types";
import { toPdfIfConvertible } from "../lib/pdf";

function nextId() {
  return Math.random().toString(36).slice(2);
}

export default function DocumentsStep({
  files,
  onChange,
  onBack,
  onNext,
}: {
  files: StagedFile[];
  onChange: (files: StagedFile[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convertOne = useCallback(async (staged: StagedFile, list: StagedFile[]) => {
    const update = (patch: Partial<StagedFile>) => {
      list = list.map((f) => (f.id === staged.id ? { ...f, ...patch } : f));
      onChange(list);
    };
    update({ status: "converting" });
    try {
      const { blob } = await toPdfIfConvertible(staged.file);
      update({ status: "ready", pdfBlob: blob });
    } catch {
      update({ status: "error", errorMessage: "Couldn't process this file" });
    }
  }, [onChange]);

  const addFiles = useCallback(
    (list: FileList | File[]) => {
      const staged: StagedFile[] = Array.from(list).map((file) => ({
        id: nextId(),
        file,
        docType: "Other" as DocumentType,
        status: "pending",
      }));
      const merged = [...files, ...staged];
      onChange(merged);
      staged.forEach((s) => convertOne(s, merged));
    },
    [files, onChange, convertOne]
  );

  const removeFile = (id: string) => onChange(files.filter((f) => f.id !== id));
  const setDocType = (id: string, docType: DocumentType) =>
    onChange(files.map((f) => (f.id === id ? { ...f, docType } : f)));

  const allReady = files.length > 0 && files.every((f) => f.status === "ready");

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-ink">Upload Documents</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Select one or more files — images, .docx and .txt are converted to PDF automatically
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragActive ? "border-study bg-study-soft" : "border-line hover:border-study/50"
        }`}
      >
        <UploadCloud className="h-8 w-8 text-study" aria-hidden="true" />
        <p className="mt-2 font-bold text-ink">Drop files here or click to browse</p>
        <p className="mt-1 text-xs text-ink-mute">PDF · JPG · PNG · GIF · BMP · DOCX · DOC · TXT · XLS + more</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {files.length === 0 ? (
        <p className="mt-4 text-center text-sm text-ink-mute">No files selected yet</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
              <FileText className="h-5 w-5 shrink-0 text-ink-mute" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{f.file.name}</p>
                <select
                  value={f.docType}
                  onChange={(e) => setDocType(f.id, e.target.value as DocumentType)}
                  className="mt-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink-soft"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {f.status === "converting" && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-study" aria-hidden="true" />}
              {f.status === "ready" && <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />}
              {f.status === "error" && <AlertCircle className="h-5 w-5 shrink-0 text-urgent" aria-hidden="true" />}
              <button onClick={() => removeFile(f.id)} aria-label="Remove file" className="shrink-0 rounded-lg p-1 text-ink-mute hover:bg-surface">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="rounded-full border border-line px-6 py-3.5 font-bold text-ink hover:bg-surface">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!allReady}
          className="flex-1 rounded-full bg-study px-6 py-3.5 font-bold text-white transition-all hover:bg-study-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continue to Submit →
        </button>
      </div>
    </div>
  );
}
