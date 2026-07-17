import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import DetailsStep from "./components/DetailsStep";
import DocumentsStep from "./components/DocumentsStep";
import SubmitStep from "./components/SubmitStep";
import SetupModal from "./components/SetupModal";
import { getScriptUrl } from "./lib/storage";
import type { ApplicantDetails, StagedFile } from "./types";

const EMPTY_DETAILS: ApplicantDetails = {
  fullName: "",
  email: "",
  phone: "",
  destination: "",
  program: "",
  city: "",
  gender: "",
  dob: "",
  age: "",
};

const STEP_LABELS = ["Your Details", "Upload Documents", "Submit"];

export default function App() {
  const [step, setStep] = useState(0);
  const [details, setDetails] = useState<ApplicantDetails>(EMPTY_DETAILS);
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(Boolean(getScriptUrl()));
  }, []);

  function reset() {
    setDetails(EMPTY_DETAILS);
    setFiles([]);
    setStep(0);
  }

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

      <main className="mx-auto max-w-2xl px-5 py-8">
        <ol className="mb-6 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-mute">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className={`flex items-center gap-2 ${i === step ? "text-study" : i < step ? "text-success" : ""}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${i <= step ? "border-study bg-study text-white" : "border-line"}`}>
                {i + 1}
              </span>
              {label}
              {i < STEP_LABELS.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {step === 0 && <DetailsStep details={details} onChange={setDetails} onNext={() => setStep(1)} />}
          {step === 1 && (
            <DocumentsStep files={files} onChange={setFiles} onBack={() => setStep(0)} onNext={() => setStep(2)} />
          )}
          {step === 2 && (
            <SubmitStep
              details={details}
              files={files}
              onBack={() => setStep(1)}
              onReset={reset}
              onOpenSetup={() => setSetupOpen(true)}
            />
          )}
        </div>
      </main>

      {setupOpen && (
        <SetupModal
          onClose={() => setSetupOpen(false)}
          onSaved={() => setConnected(true)}
        />
      )}
    </div>
  );
}
