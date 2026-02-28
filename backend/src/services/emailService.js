/**
 * emailService – Location Alert Emails
 * ─────────────────────────────────────
 * In development (or when no SMTP is configured) it simply logs to the console.
 * In production you can wire up Nodemailer, SendGrid, AWS SES, etc.
 */

const nodemailer = (() => {
  try { return require('nodemailer'); } catch { return null; }
})();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.NODEMAILER_HOST;
  const port = Number(process.env.NODEMAILER_PORT || 587);
  const user = process.env.NODEMAILER_USER;
  const pass = process.env.NODEMAILER_PASS;

  if (!nodemailer || !host || !user || !pass) {
    return null; // no real mailer configured
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send a geofence-breach alert email to all of the elderly user's emergency contacts.
 * Falls back to a console log when no SMTP is configured.
 *
 * @param {Object} user       – Mongoose User document
 * @param {number} distance   – How far outside the safe zone (metres)
 */
async function sendAlertEmail(user, distance) {
  const recipients = (user.emergencyContacts || [])
    .map((c) => c.email)
    .filter(Boolean);

  const subject = `⚠️ MindBridge Alert: ${user.name || 'Patient'} left the safe zone`;
  const text = [
    `Hello,`,
    ``,
    `${user.name || 'The patient'} has moved approximately ${Math.round(distance)} metres outside their safe zone.`,
    ``,
    `Current coordinates: ${user.currentLocation?.latitude?.toFixed(6)}, ${user.currentLocation?.longitude?.toFixed(6)}`,
    ``,
    `Please check on them as soon as possible.`,
    ``,
    `— MindBridge Safety System`,
  ].join('\n');

  const mailer = getTransporter();

  if (!mailer || recipients.length === 0) {
    // Dev / unconfigured – just log
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[MOCK EMAIL] Location Alert');
    console.log(`  To:       ${recipients.length ? recipients.join(', ') : '(no recipients configured)'}`);
    console.log(`  Subject:  ${subject}`);
    console.log(`  Body:     ${user.name || 'Patient'} is ${Math.round(distance)}m outside safe zone`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return;
  }

  await mailer.sendMail({
    from: process.env.NODEMAILER_USER,
    to: recipients.join(','),
    subject,
    text,
  });

  console.log(`[Email] Alert sent to ${recipients.join(', ')} for user ${user._id}`);
}

module.exports = { sendAlertEmail };
