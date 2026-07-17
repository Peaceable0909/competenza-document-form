import type { ApplicantDetails, StagedFile } from "../types";
import { blobToBase64 } from "./pdf";

function extensionFor(file: File, isPdf: boolean): string {
  if (isPdf) return "pdf";
  const parts = file.name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "bin";
}

/** "(Student Name) - Document Type.ext", numbered on collisions. */
function buildFileName(studentName: string, docType: string, ext: string, usedNames: Set<string>): string {
  const base = `${studentName} - ${docType}`;
  let name = `${base}.${ext}`;
  let n = 2;
  while (usedNames.has(name)) {
    name = `${base} (${n}).${ext}`;
    n++;
  }
  usedNames.add(name);
  return name;
}

export async function buildSubmissionPayload(details: ApplicantDetails, files: StagedFile[]) {
  const usedNames = new Set<string>();
  const documents = await Promise.all(
    files.map(async (f) => {
      const blob = f.pdfBlob ?? f.file;
      const isPdf = blob.type === "application/pdf" || f.pdfBlob !== undefined;
      const ext = extensionFor(f.file, isPdf);
      const fileName = buildFileName(details.fullName.trim(), f.docType, ext, usedNames);
      const base64 = await blobToBase64(blob);
      return { fileName, mimeType: isPdf ? "application/pdf" : f.file.type || "application/octet-stream", base64 };
    })
  );

  return {
    applicant: details,
    documents,
    submittedAt: new Date().toISOString(),
  };
}
