import { useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, MessageCircle, PartyPopper, Settings2 } from "lucide-react";
import { destinations } from "../data/destinations";
import { DOC_SLOTS, type ApplicantDetails, type DocSlotKey, type DocSlots, type StagedFile, type SubmitStage } from "../types";
import { buildSubmissionPayload } from "../lib/payload";
import { getScriptUrl } from "../lib/storage";
import { makeReferenceId } from "../lib/referenceId";
import DocumentSlot from "./DocumentSlot";
import PreviewModal, { type PreviewFile } from "./PreviewModal";

const EMPTY_DETAILS: ApplicantDetails = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  destination: "",
  program: "",
  message: "",
};

const inputCls =
  "mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium outline-none transition-all focus:border-study focus:ring-4 focus:ring-study-soft";
const labelCls = "block text-sm font-bold";
const fieldsetCls = "rounded-3xl border border-line bg-white p-7";
const legendCls = "px-2 font-display text-lg font-bold";

const WHATSAPP = "https://wa.me/2340000000000";

export default function ApplicationForm({ onOpenSetup }: { onOpenSetup?: () => void }) {
  const [details, setDetails] = useState<ApplicantDetails>(EMPTY_DETAILS);
  const [slots, setSlots] = useState<DocSlots>({});
  const [stage, setStage] = useState<SubmitStage>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ referenceId: string; driveUrl: string } | null>(null);
  const [preview, setPreview] = useState<PreviewFile | null>(null);

  function openPreview(blob: Blob, fileName: string) {
    setPreview({ url: URL.createObjectURL(blob), fileName, mimeType: blob.type });
  }
  function closePreview() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  const dest = destinations.find((d) => d.name === details.destination);
  const set = <K extends keyof ApplicantDetails>(key: K, value: ApplicantDetails[K]) =>
    setDetails((d) => ({ ...d, [key]: value, ...(key === "destination" ? { program: "" } : {}) }));

  const setSlot = (key: DocSlotKey, staged: StagedFile | undefined) =>
    setSlots((s) => {
      const next = { ...s };
      if (staged) next[key] = staged;
      else delete next[key];
      return next;
    });

  const hasConvertingSlot = Object.values(slots).some((s) => s?.status === "converting");
  const hasErrorSlot = Object.values(slots).some((s) => s?.status === "error");
  const canSubmit =
    Boolean(details.fullName && details.email && details.phone && details.country && details.destination) &&
    !hasConvertingSlot &&
    !hasErrorSlot &&
    stage !== "submitting";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const scriptUrl = getScriptUrl();
    if (!scriptUrl) {
      if (onOpenSetup) {
        onOpenSetup();
      } else {
        setError("Applications aren't open yet — please check back shortly or message us on WhatsApp.");
      }
      return;
    }
    setError("");
    setStage("submitting");
    try {
      const referenceId = makeReferenceId();
      const payload = await buildSubmissionPayload(details, slots, referenceId);
      // text/plain avoids a CORS preflight that Apps Script web apps can't
      // answer — Code.gs reads e.postData.contents and JSON.parses it itself.
      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "The script reported an error");
      setResult({ referenceId, driveUrl: data.driveUrl || "" });
      setStage("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  }

  if (stage === "done" && result) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-emerald-50 p-10 text-center shadow-xl">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white" aria-hidden="true">
          <PartyPopper className="h-8 w-8" />
        </span>
        <h2 className="mt-4 font-display text-2xl font-extrabold">Application Received!</h2>
        <p className="mt-3 text-ink-soft">Your Reference ID is</p>
        <p className="mt-2 inline-block rounded-2xl bg-white px-6 py-3 font-display text-2xl font-extrabold tracking-widest text-study shadow">
          {result.referenceId}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Save this ID — you&apos;ll use it in every conversation with us. Your documents were saved to Google
          Drive and CompeTenza Admissions has been emailed. A counselor will contact you within 24–48 hours.
        </p>
        {result.driveUrl && (
          <a
            href={result.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-study underline"
          >
            View on Google Drive <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <a
          href={`${WHATSAPP}?text=${encodeURIComponent(`Hello! I just applied. My Reference ID is ${result.referenceId}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-green-500 px-7 py-3.5 font-bold text-white shadow-lg shadow-green-500/30 transition-transform hover:-translate-y-0.5"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" /> Continue on WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8">
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-urgent">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>1 · Personal Information</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={`${labelCls} sm:col-span-2`}>
            Full Name *
            <input className={inputCls} placeholder="e.g. Femi Olaniyi" value={details.fullName} onChange={(e) => set("fullName", e.target.value)} />
          </label>
          <label className={labelCls}>
            Email *
            <input type="email" className={inputCls} placeholder="you@example.com" value={details.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className={labelCls}>
            Phone (WhatsApp) *
            <input type="tel" className={inputCls} placeholder="+234 ..." value={details.phone} onChange={(e) => set("phone", e.target.value)} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Country of Residence *
            <input className={inputCls} placeholder="e.g. Nigeria" value={details.country} onChange={(e) => set("country", e.target.value)} />
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>2 · Your Goal</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelCls}>
            Preferred Destination *
            <select className={inputCls} value={details.destination} onChange={(e) => set("destination", e.target.value)}>
              <option value="" disabled>Select a destination…</option>
              {destinations.map((d) => (
                <option key={d.slug} value={d.name}>{d.name}</option>
              ))}
              <option value="Not sure yet">Not sure yet — advise me</option>
            </select>
          </label>
          <label className={labelCls}>
            Preferred Program
            <select className={inputCls} value={details.program} onChange={(e) => set("program", e.target.value)} disabled={!dest}>
              <option value="">{dest ? "Select a program…" : "Choose a destination first"}</option>
              {dest?.programs.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Anything we should know?
            <textarea
              rows={3}
              className={inputCls}
              placeholder="Your budget, timeline, qualifications…"
              value={details.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>3 · Documents</legend>
        <p className="mb-5 text-xs font-semibold text-ink-soft">
          Images, DOCX and TXT are converted to PDF automatically. Don&apos;t have everything? Submit what you
          have — a counselor will guide you on the rest.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {DOC_SLOTS.map((s) => (
            <DocumentSlot
              key={s.key}
              def={s}
              staged={slots[s.key]}
              onChange={(f) => setSlot(s.key, f)}
              onPreview={openPreview}
            />
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-full bg-study px-8 py-4 font-display text-lg font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {stage === "submitting" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Submitting…
          </span>
        ) : (
          "Submit Application →"
        )}
      </button>
      <p className="text-center text-xs font-medium text-ink-soft">
        Submitting is free. Your documents are saved to Google Drive and CompeTenza Admissions is notified by
        email.
      </p>
      {onOpenSetup && (
        <button
          type="button"
          onClick={onOpenSetup}
          className="mx-auto flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink"
        >
          <Settings2 className="h-3.5 w-3.5" /> Google Drive & Email setup
        </button>
      )}
      {preview && <PreviewModal file={preview} onClose={closePreview} />}
    </form>
  );
}
