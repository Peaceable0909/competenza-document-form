export type DocumentType = "Passport" | "Certificate" | "Transcript" | "CV" | "Other";

export const DOCUMENT_TYPES: DocumentType[] = ["Passport", "Certificate", "Transcript", "CV", "Other"];

export type StagedFile = {
  id: string;
  file: File;
  docType: DocumentType;
  /** filled in once client-side PDF conversion finishes */
  status: "pending" | "converting" | "ready" | "error";
  /** the final PDF blob that gets uploaded (original file if it was already a PDF) */
  pdfBlob?: Blob;
  finalName?: string;
  errorMessage?: string;
};

export type ApplicantDetails = {
  fullName: string;
  email: string;
  phone: string;
  destination: string;
  program: string;
  city: string;
  gender: string;
  dob: string;
  age: string;
};

export type SubmitStage =
  | "idle"
  | "converting"
  | "uploading"
  | "emailing"
  | "done"
  | "error";
