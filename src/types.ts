export type DocSlotKey = "passport" | "certificate" | "transcript" | "cv" | "other";

export type DocSlotDef = {
  key: DocSlotKey;
  label: string;
  hint: string;
};

export const DOC_SLOTS: DocSlotDef[] = [
  { key: "passport", label: "International Passport", hint: "Data page — PDF or clear photo" },
  { key: "certificate", label: "Certificates", hint: "Secondary school / degree certificate" },
  { key: "transcript", label: "Transcript", hint: "Academic transcript if available" },
  { key: "cv", label: "CV / Resume", hint: "Optional but recommended" },
  { key: "other", label: "Other Document", hint: "Anything else worth attaching" },
];

export type StagedFile = {
  file: File;
  /** filled in once client-side PDF conversion finishes */
  status: "converting" | "ready" | "error";
  /** the final PDF blob that gets uploaded (original file if it was already a PDF) */
  pdfBlob?: Blob;
  errorMessage?: string;
};

export type DocSlots = Partial<Record<DocSlotKey, StagedFile>>;

export type ApplicantDetails = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  destination: string;
  program: string;
  message: string;
};

export type SubmitStage = "idle" | "submitting" | "done" | "error";
