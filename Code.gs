/**
 * WisdomBridge — signup handler
 * Paste this over EVERYTHING in your Apps Script editor, then:
 *   Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy
 * Editing the code alone does nothing until you push a NEW VERSION.
 */

// ── CONFIG ────────────────────────────────────────────
const SHEET_ID     = 'PASTE_YOUR_SHEET_ID_HERE';   // the long id in the sheet URL
const SHEET_NAME   = 'Signups';                    // tab name, created if missing
const NOTIFY_EMAIL = 'you@example.com';            // where alerts go
// ──────────────────────────────────────────────────────

const HEADERS = ['Timestamp', 'Name', 'Email', 'Age', 'Phone', 'Country',
                 'Role', 'Expertise', 'Open To', 'Bio', 'Source'];

function doPost(e) {
  try {
    const d = parseBody_(e);

    // Email is the whole point of the form — never write a row without one.
    if (!d.email) {
      return json_({ result: 'error', message: 'no email in payload',
                     received: e && e.postData ? e.postData.contents : null });
    }

    getSheet_().appendRow([
      d.timestamp || new Date().toISOString(),
      d.name      || '',
      d.email,
      d.age       || '',
      d.phone     || '',
      d.country   || '',
      d.role      || '',
      d.expertise || '',
      d.open_to   || '',
      d.bio       || '',
      d.source    || ''
    ]);

    notify_(d);
    return json_({ result: 'success' });

  } catch (err) {
    return json_({ result: 'error', message: String(err) });
  }
}

/**
 * The form posts a JSON string as text/plain, so the fields live in
 * e.postData.contents — NOT in e.parameter. Reading e.parameter is what
 * produces blank email columns and "undefined" in the subject line.
 */
function parseBody_(e) {
  if (!e) return {};
  if (e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      // fall through to form-encoded
    }
  }
  return e.parameter || {};
}

function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function notify_(d) {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL === 'you@example.com') return;

  // Subject is stripped to plain ASCII. Emoji and accented characters in a
  // subject line are what some mail clients render as "?" — the body is
  // UTF-8 HTML, so full names in any script display correctly there.
  const who     = ascii_(d.name) || 'Someone';
  const where   = ascii_(d.country) || 'unknown country';
  const subject = 'New WisdomBridge signup: ' + who + ' (' + where + ')';

  const rows = [
    ['Name',      d.name],
    ['Email',     d.email],
    ['Age',       d.age],
    ['Phone',     d.phone],
    ['Country',   d.country],
    ['Role',      d.role],
    ['Expertise', d.expertise],
    ['Open to',   d.open_to],
    ['Bio',       d.bio],
    ['Source',    d.source]
  ].map(function (r) {
    return '<tr><td style="padding:6px 14px 6px 0;color:#8a7f70;">' + r[0] +
           '</td><td style="padding:6px 0;">' + esc_(r[1] || '—') + '</td></tr>';
  }).join('');

  MailApp.sendEmail({
    to:       NOTIFY_EMAIL,
    subject:  subject,
    replyTo:  d.email,                       // hit reply to answer them directly
    htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;">' +
              '<h2 style="color:#c8882a;">New WisdomBridge signup</h2>' +
              '<table>' + rows + '</table></div>',
    body:     'New signup\n\n' + HEADERS.slice(1).join(' | ')  // plain-text fallback
  });
}

function ascii_(s) {
  return String(s || '').replace(/[^\x20-\x7E]/g, '').trim();
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Optional: visiting the /exec URL in a browser confirms the deployment is live. */
function doGet() {
  return json_({ result: 'ok', message: 'WisdomBridge endpoint is live' });
}

/** Run this once from the editor (Run > testSignup) to check the sheet + email. */
function testSignup() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        timestamp: new Date().toISOString(),
        name: 'Test User', email: 'test@example.com', age: '65',
        phone: '+966500000000', country: 'Saudi Arabia',
        role: 'Senior / Retired professional (60+)',
        expertise: 'Engineering', open_to: 'Mentoring youth',
        bio: 'Testing the pipeline.', source: 'manual test'
      })
    }
  };
  Logger.log(doPost(fake).getContent());
}
