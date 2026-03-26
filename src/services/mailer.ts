import nodemailer from 'nodemailer';
import db from '../db.ts';

function getTransporter() {
  const settings = db.prepare('SELECT * FROM smtp_settings WHERE business_id = 1').get() as any;
  if (!settings || !settings.user || !settings.pass) {
    throw new Error('SMTP not configured. Please set up email settings in Admin Portal.');
  }
  return nodemailer.createTransport({
    host: settings.host || 'smtp.hostinger.com',
    port: settings.port || 465,
    secure: settings.secure === 1,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
  });
}

function getFromAddress() {
  const settings = db.prepare('SELECT * FROM smtp_settings WHERE business_id = 1').get() as any;
  const name = settings?.from_name || 'EPOS System';
  const email = settings?.from_email || settings?.user || 'noreply@example.com';
  return `"${name}" <${email}>`;
}

async function sendMail(to: string, subject: string, html: string) {
  const transporter = getTransporter();
  const from = getFromAddress();
  await transporter.sendMail({ from, to, subject, html });
}

const baseStyle = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #f9fafb;
  padding: 32px;
  border-radius: 8px;
`;

const btnStyle = `
  display: inline-block;
  background: #2980b9;
  color: #ffffff;
  padding: 12px 28px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  margin-top: 16px;
`;

export async function sendAccountPending(user: { name: string; email: string }) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#2c3e50;">Hi ${user.name},</h2>
      <p>Your account has been created and is currently <strong>pending approval</strong> by an administrator.</p>
      <p>You will receive an email once your account has been reviewed. This usually takes a short while.</p>
      <p style="color:#7f8c8d;font-size:13px;">If you did not request this account, please ignore this email.</p>
    </div>
  `;
  await sendMail(user.email, 'Account Pending Approval', html);
}

export async function sendAccountApproved(user: { name: string; email: string }) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#27ae60;">Hi ${user.name}, your account is approved! ✓</h2>
      <p>Great news — an administrator has approved your account. You can now log in to the EPOS system.</p>
      <p>If you have any issues, please contact your administrator.</p>
    </div>
  `;
  await sendMail(user.email, 'Account Approved ✓', html);
}

export async function sendAccountRejected(user: { name: string; email: string }) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#e74c3c;">Hi ${user.name},</h2>
      <p>Unfortunately, your account registration has been <strong>rejected</strong> by an administrator.</p>
      <p>If you believe this is a mistake, please contact your administrator directly.</p>
    </div>
  `;
  await sendMail(user.email, 'Account Registration Rejected', html);
}

export async function sendAccountDeactivated(user: { name: string; email: string }) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#e67e22;">Hi ${user.name},</h2>
      <p>Your EPOS account has been <strong>deactivated</strong> by an administrator.</p>
      <p>You will no longer be able to log in. Please contact your administrator if you have any questions.</p>
    </div>
  `;
  await sendMail(user.email, 'Account Deactivated', html);
}

export async function sendPasswordReset(user: { name: string; email: string }, resetLink: string) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#2c3e50;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset for your EPOS account. Click the button below to set a new password:</p>
      <a href="${resetLink}" style="${btnStyle}">Reset My Password</a>
      <p style="margin-top:24px;color:#7f8c8d;font-size:13px;">
        This link will expire in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
      </p>
    </div>
  `;
  await sendMail(user.email, 'Password Reset Request', html);
}

export async function sendTestEmail(toEmail: string) {
  const html = `
    <div style="${baseStyle}">
      <h2 style="color:#2980b9;">✓ SMTP Test Successful</h2>
      <p>Your Hostinger SMTP email settings are configured correctly and working.</p>
      <p style="color:#7f8c8d;font-size:13px;">Sent from your EPOS Admin Portal.</p>
    </div>
  `;
  await sendMail(toEmail, 'EPOS SMTP Test Email', html);
}
