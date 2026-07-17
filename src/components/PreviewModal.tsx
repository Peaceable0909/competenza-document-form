import { useEffect } from "react";
import { X } from "lucide-react";

export type PreviewFile = { url: string; fileName: string; mimeType: string };

export default function PreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isImage = file.mimeType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="truncate pr-4 text-sm font-bold text-ink">{file.fileName}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="shrink-0 rounded-lg p-1.5 text-ink-mute hover:bg-surface"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-surface">
          {isImage ? (
            <img src={file.url} alt={file.fileName} className="mx-auto max-h-[75vh] w-auto object-contain p-4" />
          ) : (
            <iframe src={file.url} title={file.fileName} className="h-[75vh] w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
