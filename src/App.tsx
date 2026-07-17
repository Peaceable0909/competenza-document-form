import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import ApplicationForm from "./components/ApplicationForm";
import SetupModal from "./components/SetupModal";
import { getScriptUrl } from "./lib/storage";

export default function App() {
  const [setupOpen, setSetupOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(Boolean(getScriptUrl()));
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <div>
            <h1 className="font-display text-lg font-extrabold text-ink">CompeTenza Document Portal</h1>
            <p className="text-xs text-ink-mute">Document Submission Portal</p>
          </div>
          <button
            onClick={() => setSetupOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-xs font-bold text-ink-soft hover:bg-surface"
          >
            <Settings2 className="h-3.5 w-3.5" /> Setup
          </button>
        </div>
      </header>

      {!connected && (
        <div className="mx-auto mt-4 max-w-2xl px-5">
          <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-hot-deep">
            Setup required: click "Setup" above to connect your Google Apps Script URL so documents save to Drive
            and email works.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-5 py-10">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Start Your <span className="text-study">Application</span>
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Under 10 minutes. Documents save straight to Google Drive and Admissions is emailed instantly.
          </p>
        </div>

        <ApplicationForm onOpenSetup={() => setSetupOpen(true)} />
      </main>

      {setupOpen && <SetupModal onClose={() => setSetupOpen(false)} onSaved={() => setConnected(true)} />}
    </div>
  );
}
