/**
 * CompeTenza Document Portal — Google Apps Script backend.
 *
 * Deploy: script.google.com → New Project → paste this whole file over the
 * default code → Deploy → New deployment → type "Web app" → Execute as "Me"
 * → Who has access "Anyone" → Deploy. The account you deploy as needs
 * Editor access to the Drive folder in ROOT_FOLDER_ID below. Set the
 * resulting Web App URL as the site's VITE_APPS_SCRIPT_URL env var (or,
 * for local testing, the dev-only Setup modal).
 *
 * What it does on each submission:
 *  1. Creates (or reuses) a Drive folder for the applicant.
 *  2. Saves each already-named PDF/document into that folder.
 *  3. Emails ADMIN_EMAIL with the application details and every document
 *     attached.
 *  4. Emails the applicant a confirmation.
 */

const ADMIN_EMAIL = "competenza.global@gmail.com";

// Every application is filed under this exact Drive folder (destination
// subfolder, then one folder per applicant) instead of an auto-created one.
// Taken from https://drive.google.com/drive/folders/1Velc41WrdDn6kUmOkdjR_e6nPhYs2l8S
// The account this is deployed as ("Execute as: Me") needs Editor access to it.
const ROOT_FOLDER_ID = "1Velc41WrdDn6kUmOkdjR_e6nPhYs2l8S";

const WHATSAPP_URL = "https://wa.me/2340000000000";

// Small animated "stamp" GIF used in the applicant confirmation email —
// hosted from this same project's Vercel deployment (public/flight-stamp.gif).
const STAMP_GIF_URL = "https://competenza-document-form.vercel.app/flight-stamp.gif";

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const applicant = payload.applicant || {};
    const documents = payload.documents || [];

    if (!applicant.fullName || !applicant.email) {
      return jsonResponse({ success: false, error: "Missing applicant name or email" });
    }

    const folder = getOrCreateApplicantFolder(applicant);
    const savedFiles = documents.map((doc) => saveDocument(folder, doc));

    sendAdminNotification(applicant, folder, savedFiles);
    sendApplicantConfirmation(applicant);

    return jsonResponse({
      success: true,
      referenceId: applicant.referenceId || "",
      driveUrl: folder.getUrl(),
      fileCount: savedFiles.length,
    });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return ContentService.createTextOutput("CompeTenza Document Portal script is live.");
}

function getOrCreateApplicantFolder(applicant) {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const destinationFolder = getOrCreateFolder(root, applicant.destination || "Unspecified");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  const ref = applicant.referenceId ? applicant.referenceId + " — " : "";
  const folderName = ref + applicant.fullName + " — " + stamp;
  return destinationFolder.createFolder(folderName);
}

function getOrCreateFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function saveDocument(folder, doc) {
  const bytes = Utilities.base64Decode(doc.base64);
  const blob = Utilities.newBlob(bytes, doc.mimeType, doc.fileName);
  const file = folder.createFile(blob);
  return file;
}

function sendAdminNotification(applicant, folder, files) {
  const plainBody = [
    "New application received.",
    "",
    "Reference ID: " + (applicant.referenceId || "—"),
    "Name: " + applicant.fullName,
    "Email: " + applicant.email,
    "Phone: " + applicant.phone,
    "Country of residence: " + (applicant.country || "—"),
    "Destination: " + applicant.destination,
    "Program: " + (applicant.program || "—"),
    "Notes: " + (applicant.message || "—"),
    "",
    "Documents (" + files.length + "):",
    files.map((f) => "- " + f.getName()).join("\n"),
    "",
    "Drive folder: " + folder.getUrl(),
  ].join("\n");

  const detailsHtml =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fb;border:1px solid #e0e3e5;border-radius:14px;padding:6px 18px;">' +
    detailRow("Name", applicant.fullName) +
    detailRow("Email", applicant.email) +
    detailRow("Phone", applicant.phone) +
    detailRow("Country", applicant.country || "—") +
    detailRow("Destination", applicant.destination) +
    detailRow("Program", applicant.program || "—") +
    detailRow("Notes", applicant.message || "—") +
    "</table>";

  const docsHtml = files.length
    ? files.map((f) => docRow(f.getName())).join("")
    : '<p style="margin:0;font-size:13px;color:#6b7280;">No documents attached.</p>';

  const bodyHtml =
    refBadge(applicant.referenceId) +
    '<h1 style="margin:0 0 20px;font-size:20px;font-weight:800;color:#191c1e;text-align:center;">New Application</h1>' +
    detailsHtml +
    '<div style="margin:24px 0 10px;font-size:11px;font-weight:800;letter-spacing:0.5px;color:#6b7280;">DOCUMENTS (' +
    files.length +
    ")</div>" +
    docsHtml +
    '<div style="text-align:center;">' +
    button(folder.getUrl(), "Open Drive Folder →", "#2563eb", "#1d4ed8") +
    "</div>";

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject:
      "New Application " +
      (applicant.referenceId ? "[" + applicant.referenceId + "] " : "") +
      "— " +
      applicant.fullName +
      " (" +
      applicant.destination +
      ")",
    body: plainBody,
    htmlBody: emailShell("New Application Notification", bodyHtml),
    attachments: files.map((f) => f.getBlob()),
  });
}

function sendApplicantConfirmation(applicant) {
  const plainBody = [
    "Hi " + applicant.fullName + ",",
    "",
    "We've received your application and documents for " + (applicant.program || "your program") + " in " + applicant.destination + ".",
    "Your reference ID is " + (applicant.referenceId || "—") + " — save this for any conversation with us.",
    "A counselor will review your profile and be in touch on WhatsApp or email within 24–48 hours.",
    "",
    "Thank you for choosing CompeTenza Business Services.",
  ].join("\n");

  const bodyHtml =
    '<div style="text-align:center;margin:-4px 0 8px;">' +
    '<img src="' +
    STAMP_GIF_URL +
    '" width="260" height="138" alt="Application stamped" style="display:inline-block;max-width:100%;height:auto;border:0;" />' +
    "</div>" +
    '<h1 style="margin:0 0 14px;font-size:20px;font-weight:800;color:#191c1e;text-align:center;">Hi ' +
    esc(applicant.fullName) +
    ',</h1>' +
    '<p style="margin:0;font-size:14px;line-height:1.6;color:#434655;text-align:center;">' +
    "We&rsquo;ve received your application and documents for <strong>" +
    esc(applicant.program || "your program") +
    "</strong> in <strong>" +
    esc(applicant.destination) +
    "</strong>." +
    "</p>" +
    refBadge(applicant.referenceId) +
    '<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#434655;text-align:center;">Save this ID — you&rsquo;ll use it in every conversation with us. A counselor will review your profile and be in touch on WhatsApp or email within 24–48 hours.</p>' +
    '<div style="text-align:center;">' +
    button(WHATSAPP_URL, "Continue on WhatsApp →", "#22c55e", "#16a34a") +
    "</div>" +
    '<p style="margin:26px 0 0;font-size:11px;color:#9ca3af;text-align:center;">Thank you for choosing CompeTenza Business Services.</p>';

  MailApp.sendEmail({
    to: applicant.email,
    subject: "We've received your CompeTenza application" + (applicant.referenceId ? " — " + applicant.referenceId : ""),
    body: plainBody,
    htmlBody: emailShell("Application Confirmation", bodyHtml),
  });
}

// ---- HTML email helpers ----

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(headerLabel, bodyHtml) {
  return (
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#eef1f6;padding:32px 16px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e0e3e5;box-shadow:0 1px 3px rgba(25,28,30,0.06);">' +
    '<tr><td style="background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;">' +
    '<div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.01em;">CompeTenza</div>' +
    '<div style="color:#dbeafe;font-size:12px;margin-top:3px;font-weight:600;">' +
    esc(headerLabel) +
    "</div>" +
    "</td></tr>" +
    '<tr><td style="height:5px;line-height:5px;font-size:0;background-color:#ea580c;background-image:linear-gradient(90deg,#ea580c,#2563eb,#059669);">&nbsp;</td></tr>' +
    '<tr><td style="padding:32px;">' +
    bodyHtml +
    "</td></tr>" +
    '<tr><td style="padding:18px 32px;background:#f7f9fb;border-top:1px solid #e0e3e5;">' +
    '<div style="font-size:11px;color:#6b7280;">CompeTenza Business Services &middot; Lagos, Nigeria</div>' +
    "</td></tr>" +
    "</table></div>"
  );
}

function detailRow(label, value) {
  return (
    "<tr>" +
    '<td style="padding:8px 0;font-size:11px;font-weight:800;letter-spacing:0.3px;color:#6b7280;width:120px;vertical-align:top;border-bottom:1px solid #e0e3e5;">' +
    esc(label).toUpperCase() +
    "</td>" +
    '<td style="padding:8px 0;font-size:13px;font-weight:600;color:#191c1e;border-bottom:1px solid #e0e3e5;">' +
    esc(value) +
    "</td>" +
    "</tr>"
  );
}

function docRow(fileName) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">' +
    "<tr>" +
    '<td style="padding-right:8px;vertical-align:middle;">' +
    '<span style="display:inline-block;width:16px;height:16px;line-height:16px;text-align:center;background:#059669;color:#ffffff;font-size:11px;font-weight:800;border-radius:999px;">&#10003;</span>' +
    "</td>" +
    '<td style="font-size:13px;color:#191c1e;vertical-align:middle;">' +
    esc(fileName) +
    "</td>" +
    "</tr></table>"
  );
}

function refBadge(referenceId) {
  if (!referenceId) return "";
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;">' +
    '<tr><td style="border-top:2px dashed #c3c6d7;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    "<tr><td>" +
    '<div style="text-align:center;padding:18px 0;">' +
    '<div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#6b7280;margin-bottom:8px;">REFERENCE ID</div>' +
    '<span style="display:inline-block;background-color:#eff6ff;background-image:linear-gradient(135deg,#eff6ff,#dbeafe);color:#1d4ed8;font-weight:800;font-size:20px;letter-spacing:2px;padding:12px 26px;border-radius:14px;border:1px solid #bfdbfe;">' +
    esc(referenceId) +
    "</span>" +
    "</div>" +
    "</td></tr>" +
    '<tr><td style="border-top:2px dashed #c3c6d7;font-size:0;line-height:0;">&nbsp;</td></tr>' +
    "</table>"
  );
}

function button(url, label, colorStart, colorEnd) {
  return (
    '<a href="' +
    url +
    '" style="display:inline-block;margin-top:24px;background-color:' +
    colorStart +
    ";background-image:linear-gradient(135deg," +
    colorStart +
    "," +
    (colorEnd || colorStart) +
    ');color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;padding:13px 24px;border-radius:999px;box-shadow:0 2px 6px rgba(25,28,30,0.15);">' +
    esc(label) +
    "</a>"
  );
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
