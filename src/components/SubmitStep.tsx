import { useState } from "react";
import { CheckCircle2, Loader2, ExternalLink, Settings2 } from "lucide-react";
import type { ApplicantDetails, StagedFile, SubmitStage } from "../types";
import { buildSubmissionPayload } from "../lib/payload";
import { getScriptUrl } from "../lib/storage";

const STEPS: { key: SubmitStage; label: string }[] = [
  { key: "converting", label: "Preparing documents" },
  { key: "uploading", label: "Uploading to Google Drive" },
  { key: "emailing", label: "Sending email notification" },
];

export default function SubmitStep({
  details,
  files,
  onBack,
  onReset,
  onOpenSetup,
}: {
  details: ApplicantDetails;
  files: StagedFile[];
  onBack: () => void;
  onReset: () => void;
  onOpenSetup: () => void;
}) {
  const [stage, setStage] = useState<SubmitStage>("idle");
  const [error, setError] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  async function submit() {
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      onOpenSetup();
      return;
    }
    setError("");
    try {
      setStage("converting");
      const payload = await buildSubmissionPayload(details, files);

      setStage("uploading");
      // text/plain avoids a CORS preflight that Apps Script web apps can't
      // answer — Code.gs reads e.postData.contents and JSON.parses it itself.
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "The script reported an error");

      setStage("emailing");
      setDriveUrl(data.driveUrl || "");
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage("error");
    }
  }

  if (stage === "done") {
    return (
      <div className="py-6 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-ink">Submission Received!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
          Your documents have been saved to Google Drive and emailed to CompeTenza Admissions. You'll be contacted
          on WhatsApp or email soon.
        </p>
        {driveUrl && (
          <a href={driveUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 font-bold text-study underline">
            View on Google Drive <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <button onClick={onReset} className="mt-6 block w-full rounded-full bg-study px-6 py-3.5 font-bold text-white hover:bg-study-deep">
          Submit Another
        </button>
      </div>
    );
  }

  if (stage === "converting" || stage === "uploading" || stage === "emailing") {
    return (
      <div className="py-6 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-study" aria-hidden="true" />
        <h2 className="mt-4 font-display text-lg font-extrabold text-ink">Processing...</h2>
        <p className="mt-1 text-sm text-ink-soft">Please keep this page open</p>
        <ul className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm">
          {STEPS.map((s) => {
            const order = STEPS.findIndex((x) => x.key === stage);
            const idx = STEPS.findIndex((x) => x.key === s.key);
            const done = idx < order;
            const active = idx === order;
            return (
              <li key={s.key} className={`flex items-center gap-2 ${done ? "text-success" : active ? "text-ink" : "text-ink-mute"}`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-line" />}
                {s.label}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-extrabold text-ink">Review & Submit</h2>
      <p className="mt-1 text-sm text-ink-soft">Check everything below before sending your application</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-line p-4 text-sm">
        <dt className="text-ink-mute">Name</dt><dd className="font-semibold text-ink">{details.fullName}</dd>
        <dt className="text-ink-mute">Email</dt><dd className="font-semibold text-ink">{details.email}</dd>
        <dt className="text-ink-mute">Phone</dt><dd className="font-semibold text-ink">{details.phone}</dd>
        <dt className="text-ink-mute">Destination</dt><dd className="font-semibold text-ink">{details.destination}</dd>
        <dt className="text-ink-mute">Program</dt><dd className="font-semibold text-ink">{details.program}</dd>
        <dt className="text-ink-mute">Documents</dt><dd className="font-semibold text-ink">{files.length} file(s)</dd>
      </dl>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-urgent">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="rounded-full border border-line px-6 py-3.5 font-bold text-ink hover:bg-surface">
          ← Back
        </button>
        <button onClick={submit} className="flex-1 rounded-full bg-hot px-6 py-3.5 font-bold text-white transition-all hover:bg-hot-deep">
          Submit Documents
        </button>
      </div>
      <button onClick={onOpenSetup} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink">
        <Settings2 className="h-3.5 w-3.5" /> Google Drive & Email setup
      </button>
    </div>
  );
}
