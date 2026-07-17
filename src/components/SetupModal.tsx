import { useState } from "react";
import { X } from "lucide-react";
import { getScriptUrl, setScriptUrl } from "../lib/storage";

export default function SetupModal({ onClose, onSaved }: { onClose: () => void; onSaved: (url: string) => void }) {
  const [url, setUrl] = useState(getScriptUrl());

  function save() {
    if (!url.trim().startsWith("https://script.google.com/")) {
      alert("That doesn't look like a Google Apps Script Web App URL — it should start with https://script.google.com/");
      return;
    }
    setScriptUrl(url);
    onSaved(url.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-extrabold text-ink">Google Drive & Email Setup</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-ink-mute hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Step-by-step: deploy your Google Apps Script</p>

        <ol className="mt-4 space-y-3 text-sm text-ink-soft">
          <li>
            <span className="font-bold text-ink">1.</span> Go to{" "}
            <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-study underline">
              script.google.com
            </a>{" "}
            — sign in with the Gmail account that should receive applications.
          </li>
          <li>
            <span className="font-bold text-ink">2.</span> Click <strong>New Project</strong>, delete the default
            code, and paste in the entire contents of <code className="rounded bg-surface px-1.5 py-0.5">Code.gs</code> from this project.
          </li>
          <li>
            <span className="font-bold text-ink">3.</span> Click <strong>Deploy → New deployment</strong>. Type: <strong>Web App</strong>.
            Execute as: <strong>Me</strong>. Who has access: <strong>Anyone</strong>. Click <strong>Deploy</strong>.
          </li>
          <li>
            <span className="font-bold text-ink">4.</span> Copy the Web App URL (starts with{" "}
            <code className="rounded bg-surface px-1.5 py-0.5">https://script.google.com/macros/s/...</code>) and paste it below.
          </li>
        </ol>

        <label className="mt-5 block text-sm font-bold text-ink">Google Apps Script Web App URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://script.google.com/macros/s/ABC.../exec"
          className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-study"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-bold text-ink-soft hover:bg-surface">
            Cancel
          </button>
          <button onClick={save} className="rounded-full bg-study px-5 py-2.5 text-sm font-bold text-white hover:bg-study-deep">
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
}
