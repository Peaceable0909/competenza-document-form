const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp", "image/webp"]);
const DOCX_TYPES = new Set(["application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const TEXT_TYPES = new Set(["text/plain"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = src;
  });
}

/** Wraps a single image in a one-page PDF sized to the image itself. */
async function imageToPdfBlob(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const { jsPDF } = await import("jspdf");
  const orientation = img.width >= img.height ? "l" : "p";
  const doc = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
  doc.addImage(dataUrl, "JPEG", 0, 0, img.width, img.height);
  return doc.output("blob");
}

/** Renders arbitrary HTML (from mammoth's docx conversion) into a paginated A4 PDF. */
async function htmlToPdfBlob(html: string): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  // jsPDF's .html() renders a live DOM node (via html2canvas), so the
  // container has to actually be attached — kept off-screen and cleaned up
  // in the finally block either way.
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:520pt;font-family:Arial,sans-serif;font-size:11pt;line-height:1.4;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await new Promise<void>((resolve, reject) => {
      doc.html(container, {
        x: 36,
        y: 36,
        width: 520,
        windowWidth: 520,
        callback: () => resolve(),
        html2canvas: { logging: false },
      });
      // jsPDF's html() has no built-in rejection path — this is a safety net
      // in case rendering hangs on a malformed document.
      setTimeout(() => reject(new Error("Document took too long to render")), 20000);
    });
  } finally {
    container.remove();
  }

  return doc.output("blob");
}

async function docxToPdfBlob(file: File): Promise<Blob> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
  return htmlToPdfBlob(html || "<p><em>(empty document)</em></p>");
}

async function textToPdfBlob(file: File): Promise<Blob> {
  const text = await file.text();
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n")
    .map((line) => `<p style="margin:0 0 6pt">${line || "&nbsp;"}</p>`)
    .join("");
  return htmlToPdfBlob(escaped);
}

/**
 * Converts what it reasonably can to PDF client-side:
 *  - images (jpg/png/gif/bmp/webp) → one-page PDF
 *  - .docx → PDF via mammoth (docx → HTML) + jsPDF's HTML renderer
 *  - .txt → PDF
 *  - already a PDF → passed through untouched
 * Legacy .doc, .rtf, .ppt/.pptx, .xls/.xlsx aren't converted — real support
 * needs a server-side converter (e.g. LibreOffice), which this intentionally
 * doesn't have. Those upload as-is with their original extension.
 */
export async function toPdfIfConvertible(file: File): Promise<{ blob: Blob; isPdf: boolean }> {
  const ext = extOf(file.name);
  if (file.type === "application/pdf" || ext === "pdf") {
    return { blob: file, isPdf: true };
  }
  if (IMAGE_TYPES.has(file.type)) {
    return { blob: await imageToPdfBlob(file), isPdf: true };
  }
  if (DOCX_TYPES.has(file.type) || ext === "docx") {
    return { blob: await docxToPdfBlob(file), isPdf: true };
  }
  if (TEXT_TYPES.has(file.type) || ext === "txt") {
    return { blob: await textToPdfBlob(file), isPdf: true };
  }
  return { blob: file, isPdf: false };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:<mime>;base64," prefix — Apps Script just wants the raw base64
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not encode file"));
    reader.readAsDataURL(blob);
  });
}
