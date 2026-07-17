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
    sendApplicantConfirmation(applicant, folder);

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
  const body = [
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

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "New Application " + (applicant.referenceId ? "[" + applicant.referenceId + "] " : "") + "— " + applicant.fullName + " (" + applicant.destination + ")",
    body: body,
    attachments: files.map((f) => f.getBlob()),
  });
}

function sendApplicantConfirmation(applicant, folder) {
  const body = [
    "Hi " + applicant.fullName + ",",
    "",
    "We've received your application and documents for " + (applicant.program || "your program") + " in " + applicant.destination + ".",
    "Your reference ID is " + (applicant.referenceId || "—") + " — save this for any conversation with us.",
    "A counselor will review your profile and be in touch on WhatsApp or email within 24–48 hours.",
    "",
    "Thank you for choosing CompeTenza Business Services.",
  ].join("\n");

  MailApp.sendEmail({
    to: applicant.email,
    subject: "We've received your CompeTenza application" + (applicant.referenceId ? " — " + applicant.referenceId : ""),
    body: body,
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
