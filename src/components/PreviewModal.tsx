import { useEffect } from "react";
import { Download, FileWarning, X } from "lucide-react";

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
  const isPdf = file.mimeType === "application/pdf";

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
          ) : isPdf ? (
            <iframe src={file.url} title={file.fileName} className="h-[75vh] w-full" />
          ) : (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
              <FileWarning className="h-10 w-10 text-ink-mute" aria-hidden="true" />
              <p className="max-w-xs text-sm font-semibold text-ink-soft">
                This file type can&apos;t be previewed in the browser, but it will still upload correctly.
              </p>
              <a
                href={file.url}
                download={file.fileName}
                className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-study px-5 py-2.5 text-xs font-bold text-white hover:bg-study-deep"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download to check it
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
