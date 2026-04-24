/**
 * ═══════════════════════════════════════════════════════
 *  WisdomBridge — Google Apps Script Backend
 *  Replaces Make.com entirely. Paste this into:
 *  script.google.com → New project → paste → deploy
 * ═══════════════════════════════════════════════════════
 *
 *  What this does when someone submits the signup form:
 *  1. Receives their data instantly
 *  2. Adds a new row to your Google Sheet
 *  3. Sends them a warm welcome email
 *  4. Sends YOU a notification email
 *  5. Returns success to the form so the user sees ✓
 *
 *  Total time: ~1 second. No third parties. Free forever.
 * ═══════════════════════════════════════════════════════
 */


// ── CONFIGURATION ── change these two values only ──────
const SHEET_NAME    = 'WisdomBridge Members';   // exact name of your Google Sheet
const NOTIFY_EMAIL  = 'your@email.com';          // your email for new member alerts
// ───────────────────────────────────────────────────────


/**
 * doPost — called automatically when the form submits
 * This is the main entry point. Google runs this function
 * every time your website sends a signup.
 */
function doPost(e) {
  try {
    // Parse the incoming data from the form
    const data = JSON.parse(e.postData.contents);

    // Save to Google Sheets
    saveToSheet(data);

    // Send welcome email to the new member
    sendWelcomeEmail(data);

    // Send notification to yourself
    sendNotificationEmail(data);

    // Tell the form everything worked
    return success('Saved successfully');

  } catch (error) {
    // Log the error so you can debug it in Apps Script
    console.error('WisdomBridge error:', error);
    return failure(error.message);
  }
}


/**
 * doGet — handles browser test visits to your script URL
 * Lets you check the script is live by visiting the URL directly
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'WisdomBridge backend is running',
      time: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * saveToSheet — adds one row to your Google Sheet
 * Finds the sheet by name, appends a new row at the bottom
 */
function saveToSheet(data) {
  // Open the spreadsheet and find the right sheet
  const files = DriveApp.getFilesByName(SHEET_NAME);

  if (!files.hasNext()) {
    throw new Error('Sheet "' + SHEET_NAME + '" not found. Check the name matches exactly.');
  }

  const spreadsheet = SpreadsheetApp.open(files.next());
  const sheet = spreadsheet.getSheets()[0];

  // If this is the very first row, add column headers
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Email',
      'Age',
      'Phone',
      'Country',
      'Role',
      'Expertise',
      'Open To',
      'Bio / Career',
      'Source'
    ]);

    // Make headers bold
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Add the new member's data as a new row
  sheet.appendRow([
    new Date(),                      // Timestamp — real date object for sorting
    data.name        || '—',
    data.email       || '—',
    data.age         || '—',
    data.phone       || '—',
    data.country     || '—',
    data.role        || '—',
    data.expertise   || '—',
    data.open_to     || '—',
    data.bio         || '—',
    data.source      || 'direct'
  ]);

  console.log('Saved to sheet:', data.name, data.email);
}


/**
 * sendWelcomeEmail — sends a warm personal email to the new member
 * Uses Gmail, which is part of your Google account — no API keys needed
 */
function sendWelcomeEmail(data) {
  if (!data.email) return;  // Skip if no email provided

  const name = data.name || 'friend';
  const subject = 'Welcome to WisdomBridge, ' + name + ' 🌿';

  const body = `Dear ${name},

Thank you for joining WisdomBridge.

You are now part of the founding community of something I have been dreaming about for years — a global platform where the wisdom of experienced people like you reaches the next generation.

Your lifetime of experience matters. The young people, universities, and communities we are connecting with need exactly what you have built and learned over your career.

${data.expertise && data.expertise !== '—' ? 'Your expertise in ' + data.expertise + ' is precisely the kind of knowledge we need to preserve and share.' : 'Whatever your field, your story is worth telling.'}

Here is what happens next:

  → We are building the platform right now, shaped around people like you.
  → You will be among the very first to receive access when we launch.
  → We will reach out personally to our founding members before the public launch.

In the meantime, if you know someone whose wisdom the world needs to hear, please share this link with them.

With gratitude,
The WisdomBridge Team

──────────────────────────────
Reply to this email anytime. Every message is read personally.
Your information is private and will never be shared or sold.`;

  // HTML version — looks beautiful in email clients
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#faf6ef;font-family:Georgia,serif;">
<div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(92,72,48,0.10);">

  <!-- Header -->
  <div style="background:#1a1208;padding:32px 40px;">
    <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#e8b96a;letter-spacing:0.01em;">WisdomBridge</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">Connecting generations worldwide</div>
  </div>

  <!-- Body -->
  <div style="padding:40px;">
    <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1a1208;margin:0 0 8px;line-height:1.2;">
      Welcome, <em style="color:#c8882a;">${name}.</em>
    </h1>
    <p style="font-size:15px;color:#6b5d4f;line-height:1.8;margin:0 0 24px;">
      You are now part of the founding community of WisdomBridge — a global platform built to make sure your lifetime of experience reaches the people who need it most.
    </p>

    ${data.expertise && data.expertise !== '—' ? `
    <div style="background:#fdf3e0;border-left:3px solid #c8882a;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="font-size:14px;color:#5c4830;margin:0;line-height:1.6;">
        Your expertise in <strong>${data.expertise}</strong> is exactly the kind of knowledge WisdomBridge exists to share. Someone, somewhere, is waiting to learn from you.
      </p>
    </div>` : ''}

    <h2 style="font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1a1208;margin:0 0 14px;">What happens next</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="width:28px;vertical-align:top;padding:6px 12px 6px 0;">
          <div style="width:24px;height:24px;border-radius:50%;background:#eaf2ea;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#5a7a5a;text-align:center;line-height:24px;">1</div>
        </td>
        <td style="font-size:14px;color:#6b5d4f;line-height:1.6;padding:6px 0;">We are building the platform right now, shaped around founding members like you.</td>
      </tr>
      <tr>
        <td style="width:28px;vertical-align:top;padding:6px 12px 6px 0;">
          <div style="width:24px;height:24px;border-radius:50%;background:#eaf2ea;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#5a7a5a;text-align:center;line-height:24px;">2</div>
        </td>
        <td style="font-size:14px;color:#6b5d4f;line-height:1.6;padding:6px 0;">You will receive early access before the public launch.</td>
      </tr>
      <tr>
        <td style="width:28px;vertical-align:top;padding:6px 12px 6px 0;">
          <div style="width:24px;height:24px;border-radius:50%;background:#eaf2ea;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#5a7a5a;text-align:center;line-height:24px;">3</div>
        </td>
        <td style="font-size:14px;color:#6b5d4f;line-height:1.6;padding:6px 0;">We will reach out personally — every founding member matters to us.</td>
      </tr>
    </table>

    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:14px;color:#6b5d4f;margin:0 0 16px;">Know someone whose wisdom the world needs to hear?</p>
      <a href="https://wisdombridge.netlify.app" style="display:inline-block;padding:14px 32px;background:#1a1208;color:white;text-decoration:none;border-radius:8px;font-family:Georgia,serif;font-size:15px;font-weight:700;letter-spacing:0.04em;">Share WisdomBridge →</a>
    </div>

    <p style="font-size:14px;color:#6b5d4f;line-height:1.8;margin:0;">With gratitude,<br><strong style="color:#1a1208;">The WisdomBridge Team</strong></p>
  </div>

  <!-- Footer -->
  <div style="background:#f5f0e8;padding:20px 40px;border-top:1px solid rgba(139,111,71,0.15);">
    <p style="font-size:11px;color:#9e8e82;margin:0;line-height:1.6;text-align:center;">
      Reply to this email anytime — every message is read personally.<br>
      Your information is private and will never be shared or sold.
    </p>
  </div>

</div>
</body>
</html>`;

  GmailApp.sendEmail(data.email, subject, body, {
    htmlBody: htmlBody,
    name: 'WisdomBridge'
  });

  console.log('Welcome email sent to:', data.email);
}


/**
 * sendNotificationEmail — alerts YOU every time someone joins
 * Short, scannable email you can read at a glance on your phone
 */
function sendNotificationEmail(data) {
  const subject = '🌿 New member: ' + (data.name || 'Someone') + ' from ' + (data.country || 'unknown');

  const body = `New WisdomBridge signup

Name:      ${data.name || '—'}
Email:     ${data.email || '—'}
Age:       ${data.age || '—'}
Country:   ${data.country || '—'}
Role:      ${data.role || '—'}
Expertise: ${data.expertise || '—'}
Open to:   ${data.open_to || '—'}
Bio:       ${data.bio || '—'}
Time:      ${new Date().toLocaleString()}
Source:    ${data.source || 'direct'}

View all members:
https://docs.google.com/spreadsheets`;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body, {
    name: 'WisdomBridge Signups'
  });
}


/**
 * Helper functions — return proper responses to the form
 */
function success(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function failure(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * ── TEST FUNCTION ──
 * Run this inside Apps Script to test without the website.
 * Click the ▶ Run button with this function selected.
 */
function testScript() {
  const fakeData = {
    postData: {
      contents: JSON.stringify({
        name:      'Test User',
        email:     NOTIFY_EMAIL,   // sends test email to yourself
        age:       '65',
        phone:     '+966 50 000 0000',
        country:   'Saudi Arabia',
        role:      'Senior / Retired professional (60+)',
        expertise: 'Engineering',
        open_to:   'Mentoring youth, Hosting webinars',
        bio:       'This is a test signup to verify the script works.',
        source:    'test'
      })
    }
  };

  const result = doPost(fakeData);
  console.log('Test result:', result.getContent());
  console.log('✓ Check your Google Sheet and email inbox');
}
