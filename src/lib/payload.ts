import { DOC_SLOTS, type ApplicantDetails, type DocSlots } from "../types";
import { blobToBase64 } from "./pdf";

function extensionFor(file: File, isPdf: boolean): string {
  if (isPdf) return "pdf";
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "bin";
}

export async function buildSubmissionPayload(details: ApplicantDetails, slots: DocSlots, referenceId: string) {
  const documents = await Promise.all(
    DOC_SLOTS.filter((s) => slots[s.key]).map(async (s) => {
      const staged = slots[s.key]!;
      const blob = staged.pdfBlob ?? staged.file;
      const isPdf = blob.type === "application/pdf" || staged.pdfBlob !== undefined;
      const ext = extensionFor(staged.file, isPdf);
      const fileName = `${details.fullName.trim()} - ${s.label}.${ext}`;
      const base64 = await blobToBase64(blob);
      return { fileName, mimeType: isPdf ? "application/pdf" : staged.file.type || "application/octet-stream", base64 };
    })
  );

  return {
    applicant: { ...details, referenceId },
    documents,
    submittedAt: new Date().toISOString(),
  };
}
