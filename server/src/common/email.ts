import { Resend } from 'resend';
import { AppError } from './errors';
import { env } from '../config/env';

/**
 * Payload accepted by `MailService.sendEmail`. Mirrors the transport-agnostic
 * surface used by the app's email senders.
 */
export interface MailPayload {
  /** Recipient email address. */
  to: string;
  /** Optional recipient display name. */
  toName?: string;
  /** Email subject line. */
  subject: string;
  /** HTML body content. */
  htmlContent: string;
  /** Optional plain-text body content. */
  textContent?: string;
}

/**
 * Centralized Resend transactional email transport.
 *
 * Resend sends over the HTTPS API (not SMTP), which works on Railway without
 * SMTP port configuration. NOTE: the `EMAIL_FROM` sender must be an address on
 * a domain you own and verify in Resend — Resend does not send from arbitrary
 * senders.
 *
 * Production hardening: sending requires both `RESEND_API_KEY` and a configured
 * `EMAIL_FROM`. If either is missing in production, delivery fails loudly (500)
 * so a misconfigured deployment is never silently dropped; only development and
 * test fall back to logging codes to the console.
 */
class MailService {
  private readonly client: Resend | null;

  constructor() {
    this.client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  async sendEmail(payload: MailPayload): Promise<void> {
    const configured = Boolean(this.client && env.EMAIL_FROM);

    if (configured) {
      try {
        await this.client!.emails.send({
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
          to: payload.to,
          subject: payload.subject,
          html: payload.htmlContent,
          text: payload.textContent,
        });
        return;
      } catch (error) {
        // Log the useful server-side error; the API key is never surfaced. The
        // AppError flows through the app's standard error-handler so the client
        // receives the usual error response (and no false success is reported).
        console.error(`[RESEND] Failed to send email to ${payload.to}:`, error);
        throw new AppError(500, 'Failed to send email');
      }
    }

    // Not fully configured. In production this must fail loudly rather than
    // silently dropping auth emails, so operators notice the misconfiguration.
    if (env.NODE_ENV === 'production') {
      console.error(
        '[RESEND] Email delivery is not configured. Set RESEND_API_KEY and ' +
          'EMAIL_FROM (a verified Resend sender) in the production environment.',
      );
      throw new AppError(500, 'Email delivery is not configured');
    }

    // Development/test fallback — log the code to the console.
    console.warn(
      `[DEV EMAIL] Subject "${payload.subject}" for ${payload.to}: ${payload.textContent ?? payload.htmlContent}`,
    );
  }
}

const mailService = new MailService();

const BRAND = {
  primary: '#0e7c56',
  primaryLight: '#e6f3ec',
  primaryDark: '#0b5d41',
  background: '#faf9f6',
  card: '#ffffff',
  foreground: '#20242b',
  muted: '#5c6670',
  border: '#e6e2d9',
  accent: '#e6f3ec',
};

const LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
  <path d="M9 15l2 2 4-4"/>
</svg>
`;

const CHECK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m9 12 2 2 4-4"/>
</svg>
`;

const SHIELD_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>
`;

const LOCK_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
</svg>
`;

const FOLDER_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
</svg>
`;

const FILE_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
  <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
</svg>
`;

const UPLOAD_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${BRAND.primary}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
  <polyline points="17 8 12 3 7 8"/>
  <line x1="12" x2="12" y1="3" y2="15"/>
</svg>
`;

function wrapTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Managing Your Files</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:${BRAND.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${previewText}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.background};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:${BRAND.primary};border-radius:12px;padding:12px;">
                    ${LOGO_SVG}
                  </td>
                  <td style="padding-left:12px;">
                    <span style="font-size:20px;font-weight:600;color:${BRAND.foreground};letter-spacing:-0.02em;">
                      Managing Your Files
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${BRAND.card};border-radius:16px;border:1px solid ${BRAND.border};overflow:hidden;">
                ${content}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color:${BRAND.primaryLight};border-radius:8px;padding:8px;">
                          ${FOLDER_ICON}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <span style="font-size:14px;font-weight:600;color:${BRAND.foreground};">
                      Managing Your Files
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <span style="font-size:13px;color:${BRAND.muted};">
                      Secure file management for you and your team.
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:0 8px;">
                          <span style="font-size:12px;color:${BRAND.muted};">
                            ${FILE_ICON.replace(/width="\d+"/, 'width="16"').replace(/height="\d+"/, 'height="16"')} Files
                          </span>
                        </td>
                        <td style="padding:0 8px;">
                          <span style="font-size:12px;color:${BRAND.muted};">
                            ${UPLOAD_ICON.replace(/width="\d+"/, 'width="16"').replace(/height="\d+"/, 'height="16"')} Upload
                          </span>
                        </td>
                        <td style="padding:0 8px;">
                          <span style="font-size:12px;color:${BRAND.muted};">
                            ${SHIELD_ICON.replace(/width="\d+"/, 'width="16"').replace(/height="\d+"/, 'height="16"')} Secure
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 0 0;">
              <span style="font-size:12px;color:${BRAND.muted};">
                &copy; ${new Date().getFullYear()} Managing Your Files. All rights reserved.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<void> {
  const subject = 'Verify your Managing Your Files account';
  const text =
    `Hello,\n\n` +
    `Your verification code is ${code}.\n` +
    `It expires in 10 minutes. If you did not register, you can ignore this email.\n`;

  const content = `
    <!-- Icon -->
    <tr>
      <td align="center" style="padding:40px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:${BRAND.primaryLight};border-radius:50%;padding:20px;">
              ${CHECK_ICON}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <h1 style="margin:0;font-size:24px;font-weight:600;color:${BRAND.foreground};letter-spacing:-0.02em;">
          Verify Your Email
        </h1>
      </td>
    </tr>

    <!-- Description -->
    <tr>
      <td align="center" style="padding:12px 40px 0;">
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};">
          Welcome to Managing Your Files! Enter the code below to verify your account and get started.
        </p>
      </td>
    </tr>

    <!-- Code Box -->
    <tr>
      <td align="center" style="padding:32px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="background-color:${BRAND.background};border:2px dashed ${BRAND.border};border-radius:12px;padding:24px;text-align:center;">
              <span style="font-size:12px;font-weight:500;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.1em;">
                Your verification code
              </span>
              <br>
              <span style="display:inline-block;font-size:36px;font-weight:700;color:${BRAND.primary};letter-spacing:0.15em;font-family:'Courier New',monospace;margin-top:8px;">
                ${code}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Security Note -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="background-color:${BRAND.accent};border-radius:8px;padding:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:top;">
                    ${SHIELD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:13px;color:${BRAND.primaryDark};line-height:1.5;">
                      This code expires in <strong>10 minutes</strong>. If you did not create an account, you can safely ignore this email.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:32px 40px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-bottom:1px solid ${BRAND.border};"></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Features -->
    <tr>
      <td style="padding:24px 40px 0;">
        <span style="font-size:13px;font-weight:500;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.05em;">
          What you can do
        </span>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
          <tr>
            <td style="padding-bottom:12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${UPLOAD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Upload and organize your files
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${FILE_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Preview and download from anywhere
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${SHIELD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Secure cloud storage with encryption
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Spacer -->
    <tr>
      <td style="padding:32px 0;"></td>
    </tr>
  `;

  const html = wrapTemplate(content, `Your verification code is ${code}`);

  await mailService.sendEmail({
    to,
    subject,
    htmlContent: html,
    textContent: text,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<void> {
  const subject = 'Reset your Managing Your Files password';
  const text =
    `Hello,\n\n` +
    `Your password reset code is ${code}.\n` +
    `It expires in 10 minutes. If you did not request a password reset, you can ignore this email.\n`;

  const content = `
    <!-- Icon -->
    <tr>
      <td align="center" style="padding:40px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:${BRAND.primaryLight};border-radius:50%;padding:20px;">
              ${LOCK_ICON}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <h1 style="margin:0;font-size:24px;font-weight:600;color:${BRAND.foreground};letter-spacing:-0.02em;">
          Reset Your Password
        </h1>
      </td>
    </tr>

    <!-- Description -->
    <tr>
      <td align="center" style="padding:12px 40px 0;">
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};">
          We received a request to reset your password. Enter the code below to create a new password.
        </p>
      </td>
    </tr>

    <!-- Code Box -->
    <tr>
      <td align="center" style="padding:32px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="background-color:${BRAND.background};border:2px dashed ${BRAND.border};border-radius:12px;padding:24px;text-align:center;">
              <span style="font-size:12px;font-weight:500;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.1em;">
                Your reset code
              </span>
              <br>
              <span style="display:inline-block;font-size:36px;font-weight:700;color:${BRAND.primary};letter-spacing:0.15em;font-family:'Courier New',monospace;margin-top:8px;">
                ${code}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Security Warning -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="background-color:#fef3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:top;">
                    <span style="font-size:20px;">&#9888;</span>
                  </td>
                  <td>
                    <span style="font-size:13px;color:#856404;line-height:1.5;">
                      <strong>Security Notice:</strong> This code expires in <strong>10 minutes</strong>. If you did not request a password reset, someone may be trying to access your account. Please ignore this email or contact support.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Steps -->
    <tr>
      <td style="padding:32px 40px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-bottom:1px solid ${BRAND.border};"></td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 40px 0;">
        <span style="font-size:13px;font-weight:500;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.05em;">
          How to reset
        </span>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
          <tr>
            <td style="padding-bottom:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background-color:${BRAND.primary};color:#ffffff;border-radius:50%;font-size:12px;font-weight:600;">
                      1
                    </span>
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Go to the reset password page
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background-color:${BRAND.primary};color:#ffffff;border-radius:50%;font-size:12px;font-weight:600;">
                      2
                    </span>
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Enter your email and this code
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;background-color:${BRAND.primary};color:#ffffff;border-radius:50%;font-size:12px;font-weight:600;">
                      3
                    </span>
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Create your new password
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Spacer -->
    <tr>
      <td style="padding:32px 0;"></td>
    </tr>
  `;

  const html = wrapTemplate(content, `Your password reset code is ${code}`);

  await mailService.sendEmail({
    to,
    subject,
    htmlContent: html,
    textContent: text,
  });
}

export async function sendWelcomeEmail(
  to: string,
  toName?: string,
): Promise<void> {
  const name = toName?.trim() || 'there';
  const firstName = name.split(' ')[0] ?? name;
  const subject = `Welcome to Managing Your Files, ${firstName}`;
  const text =
    `Hello${name ? ' ' + name : ''},\n\n` +
    `Welcome to Managing Your Files! Your account is all set and ready to go.\n` +
    `Upload and organize your files, preview documents, and share them with your team — securely, from anywhere.\n\n` +
    `If you didn't create this account, someone may have signed up using your email. Please contact support immediately.\n`;

  const content = `
    <!-- Icon -->
    <tr>
      <td align="center" style="padding:40px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="background-color:${BRAND.primaryLight};border-radius:50%;padding:20px;">
              ${CHECK_ICON}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Title -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <h1 style="margin:0;font-size:24px;font-weight:600;color:${BRAND.foreground};letter-spacing:-0.02em;">
          Welcome, ${name}!
        </h1>
      </td>
    </tr>

    <!-- Description -->
    <tr>
      <td align="center" style="padding:12px 40px 0;">
        <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.muted};">
          Your account is all set and ready to go. We're glad to have you on board.
        </p>
      </td>
    </tr>

    <!-- Divider -->
    <tr>
      <td style="padding:32px 40px 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="border-bottom:1px solid ${BRAND.border};"></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Features -->
    <tr>
      <td style="padding:24px 40px 0;">
        <span style="font-size:13px;font-weight:500;color:${BRAND.muted};text-transform:uppercase;letter-spacing:0.05em;">
          What you can do
        </span>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px;">
          <tr>
            <td style="padding-bottom:12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${UPLOAD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Upload and organize your files
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:12px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${FILE_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Preview and download from anywhere
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:middle;">
                    ${SHIELD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:14px;color:${BRAND.foreground};">
                      Secure cloud storage with encryption
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Security Note -->
    <tr>
      <td align="center" style="padding:24px 40px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;">
          <tr>
            <td style="background-color:${BRAND.accent};border-radius:8px;padding:16px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding-right:12px;vertical-align:top;">
                    ${SHIELD_ICON.replace(/width="\d+"/, 'width="20"').replace(/height="\d+"/, 'height="20"')}
                  </td>
                  <td>
                    <span style="font-size:13px;color:${BRAND.primaryDark};line-height:1.5;">
                      If you didn't create this account, someone may have used your email. Contact support immediately.
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Spacer -->
    <tr>
      <td style="padding:32px 0;"></td>
    </tr>
  `;

  const html = wrapTemplate(content, `Welcome to Managing Your Files, ${name}`);

  await mailService.sendEmail({
    to,
    toName,
    subject,
    htmlContent: html,
    textContent: text,
  });
}
