/**
 * CompeTenza Document Portal — Google Apps Script backend.
 *
 * Deploy: script.google.com → New Project → paste this whole file over the
 * default code → Deploy → New deployment → type "Web app" → Execute as "Me"
 * → Who has access "Anyone" → Deploy. Paste the resulting Web App URL into
 * the site's Setup modal.
 *
 * What it does on each submission:
 *  1. Creates (or reuses) a Drive folder for the applicant.
 *  2. Saves each already-named PDF/document into that folder.
 *  3. Emails ADMIN_EMAIL with the application details and every document
 *     attached.
 *  4. Emails the applicant a confirmation.
 */

const ADMIN_EMAIL = "competenza.global@gmail.com";

const ROOT_FOLDER_NAME = "CompeTenza Applications";

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

    return jsonResponse({ success: true, driveUrl: folder.getUrl(), fileCount: savedFiles.length });
  } catch (err) {
    return jsonResponse({ success: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return ContentService.createTextOutput("CompeTenza Document Portal script is live.");
}

function getOrCreateApplicantFolder(applicant) {
  const root = getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
  const destinationFolder = getOrCreateFolder(root, applicant.destination || "Unspecified");
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmm");
  const folderName = applicant.fullName + " — " + stamp;
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
    "Name: " + applicant.fullName,
    "Email: " + applicant.email,
    "Phone: " + applicant.phone,
    "Destination: " + applicant.destination,
    "Program: " + applicant.program,
    "City: " + (applicant.city || "—"),
    "Gender: " + (applicant.gender || "—"),
    "Date of birth: " + (applicant.dob || "—"),
    "Age: " + (applicant.age || "—"),
    "",
    "Documents (" + files.length + "):",
    files.map((f) => "- " + f.getName()).join("\n"),
    "",
    "Drive folder: " + folder.getUrl(),
  ].join("\n");

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "New Application — " + applicant.fullName + " (" + applicant.destination + ")",
    body: body,
    attachments: files.map((f) => f.getBlob()),
  });
}

function sendApplicantConfirmation(applicant, folder) {
  const body = [
    "Hi " + applicant.fullName + ",",
    "",
    "We've received your application and documents for " + applicant.program + " in " + applicant.destination + ".",
    "A counselor will review your profile and be in touch on WhatsApp or email within 24–48 hours.",
    "",
    "Thank you for choosing CompeTenza Business Services.",
  ].join("\n");

  MailApp.sendEmail({
    to: applicant.email,
    subject: "We've received your CompeTenza application",
    body: body,
  });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
