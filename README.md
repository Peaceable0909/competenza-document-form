# CompeTenza Document Portal

A standalone document-submission form for CompeTenza applicants, styled and
laid out to match the main site's `/apply/` page (single page, numbered
sections, one file slot per document type). Instead of that page's
Cloudflare R2 + D1 backend, this one hands everything to a Google Apps
Script that saves files to Drive and sends email notifications — no server
of your own to run.

## How it works

1. Applicant fills in **1 · Personal Information**, **2 · Your Goal**
   (destination + program, drawn from the same list as the main site), and
   **3 · Documents** — one upload slot each for Passport, Certificates,
   Transcript, CV, and an Other/catch-all slot.
2. Converted to PDF client-side, in the browser, before upload:
   - images (jpg/png/gif/bmp/webp) → wrapped in a one-page PDF (`jsPDF`)
   - `.docx` → converted to HTML (`mammoth`) then rendered to PDF
   - `.txt` → rendered to PDF directly
   - already a `.pdf` → passed through untouched

   Legacy `.doc`, `.rtf`, `.ppt`/`.pptx`, `.xls`/`.xlsx` are **not** converted
   — real conversion of those formats needs a server-side tool (e.g.
   LibreOffice headless), which this intentionally doesn't run. Those upload
   as-is with their original extension.
3. Every file is renamed to `(Student Name) - Document Type.pdf` before
   upload.
4. On submit, a client-generated reference ID (`CTZ-XXXXXX`, same style as
   the main site's Application ID) plus everything else is POSTed as JSON to
   a Google Apps Script Web App (see `apps-script/Code.gs`), which:
   - saves the files into a Drive folder named after the applicant and
     reference ID,
   - emails `ADMIN_EMAIL` with the application details and every document
     attached,
   - sends the applicant a separate confirmation email.
5. The success screen shows the reference ID and a "Continue on WhatsApp"
   button, matching the main site's post-submit experience.

## One-time setup (per Gmail inbox that should receive applications)

1. Open `apps-script/Code.gs` in this repo and edit the `ADMIN_EMAIL`
   constant near the top to the real admissions inbox.
2. Go to [script.google.com](https://script.google.com) and sign in with
   the Gmail account that inbox belongs to.
3. **New Project** → delete the default code → paste in the entire contents
   of `apps-script/Code.gs`.
4. **Deploy → New deployment** → type **Web app** → Execute as **Me** → Who
   has access **Anyone** → **Deploy**. Authorize the permissions it asks for
   (Drive + Gmail access) — that's expected, it's what lets the script save
   files and send mail.
5. Copy the Web App URL (starts with
   `https://script.google.com/macros/s/.../exec`).
6. Open the deployed site, click **Setup** in the header, paste the URL in,
   and **Save & Connect**. It's stored in the browser's `localStorage`, so
   each device/browser that submits from this form needs to do this once
   (or you deploy it once and share the same connected build).

Re-running step 3/4 after editing `Code.gs` requires a **new** deployment
version (Deploy → Manage deployments → edit → new version) — just saving the
file in the Apps Script editor does not update a Web App URL that's already
live.

## Local development

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # production build to dist/
```

## Notes

- This is intentionally a **separate** tool from the main CompeTenza site's
  own `/apply/` flow (which uses Cloudflare R2 + D1) — both run in parallel,
  per the setup this was built for.
- Destination/program options in `src/data/destinations.ts` are a static
  copy of the ones on the main site. Update both places if a
  destination/program changes.
