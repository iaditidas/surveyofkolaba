import nodemailer from "nodemailer";
import { Resend } from "resend";
import { SurveyResponse } from "@/types/survey";

const recipientEmail =
  process.env.RECIPIENT_EMAIL ||
  process.env.SURVEY_NOTIFICATION_EMAIL ||
  "aditidas2486@gmail.com";

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
const smtpSecure = process.env.SMTP_SECURE === "false" ? false : smtpPort === 465;

const resendApiKey = process.env.RESEND_API_KEY;

export const isSmtpConfigured = Boolean(emailUser && emailPass);
export const isResendConfigured = Boolean(
  resendApiKey && resendApiKey.startsWith("re_")
);

// Format structured answer text for plain text
function formatAnswerText(val: any): string {
  if (val === undefined || val === null || val === "") return "N/A";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val.length > 0 ? val.join(", ") : "None selected";
  }
  if (typeof val === "object") {
    const lines: string[] = [];
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined && v !== null && v !== "") {
        const cleanKey = k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const displayVal = Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Yes" : "No") : String(v);
        lines.push(`  • ${cleanKey}: ${displayVal}`);
      }
    }
    return lines.length > 0 ? "\n" + lines.join("\n") : "N/A";
  }
  return String(val);
}

// Format structured answer for HTML email display
function formatAnswerHtml(val: any): string {
  if (val === undefined || val === null || val === "") {
    return `<span style="color: #94a3b8; font-style: italic;">No answer provided</span>`;
  }
  if (typeof val === "boolean") {
    return `<span style="display: inline-block; padding: 3px 10px; border-radius: 6px; font-weight: 700; font-size: 13px; background: ${
      val ? "#ecfdf5; color: #047857; border: 1px solid #a7f3d0;" : "#fef2f2; color: #b91c1c; border: 1px solid #fecaca;"
    }">${val ? "Yes" : "No"}</span>`;
  }
  if (typeof val === "number") {
    return `<span style="display: inline-block; padding: 4px 12px; background: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4; border-radius: 6px; font-weight: 700; font-size: 14px;">${val}</span>`;
  }
  if (typeof val === "string") {
    return `<div style="color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-line;">${escapeHtml(val)}</div>`;
  }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return `<span style="color: #94a3b8; font-style: italic;">None selected</span>`;
    }
    return `
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
        ${val
          .map(
            (item) =>
              `<span style="display: inline-block; padding: 3px 10px; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; border-radius: 6px; font-size: 12px; font-weight: 600; margin: 2px 4px 2px 0;">✓ ${escapeHtml(
                String(item)
              )}</span>`
          )
          .join("")}
      </div>
    `;
  }
  if (typeof val === "object") {
    const entries = Object.entries(val).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    );
    if (entries.length === 0) {
      return `<span style="color: #94a3b8; font-style: italic;">N/A</span>`;
    }
    return `
      <table style="width: 100%; border-collapse: collapse; margin-top: 6px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; overflow: hidden; font-size: 13px;">
        ${entries
          .map(([k, v]) => {
            const cleanKey = k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            const displayVal = Array.isArray(v)
              ? v.join(", ")
              : typeof v === "boolean"
              ? v ? "Yes" : "No"
              : String(v);
            return `
              <tr>
                <td style="padding: 6px 12px; color: #64748b; font-weight: 600; width: 38%; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">${escapeHtml(
                  cleanKey
                )}</td>
                <td style="padding: 6px 12px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${escapeHtml(
                  displayVal
                )}</td>
              </tr>
            `;
          })
          .join("")}
      </table>
    `;
  }
  return `<div style="color: #1e293b; font-size: 14px;">${escapeHtml(String(val))}</div>`;
}

function escapeHtml(str: any): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Build complete HTML & Plain text email bodies
export function generateEmailContent(response: SurveyResponse) {
  const submissionDate = new Date(response.created_at || Date.now()).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Asia/Kolkata",
  });

  const subject = `[Kolaba Survey] New ${response.respondent_type_label || "Response"} — ${response.respondent_name} (${response.college || "Campus"})`;

  // Build survey answers formatted list (handles structured SurveyPathStep[] or raw answers map)
  const hasValidPath =
    Array.isArray(response.survey_path) &&
    response.survey_path.length > 0 &&
    typeof response.survey_path[0] === "object" &&
    response.survey_path[0] !== null;

  const answersListHtml = hasValidPath
    ? (response.survey_path as any[])
        .map(
          (step, idx) => `
          <div style="margin-bottom: 16px; padding: 14px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              Question ${step.stepNumber || idx + 1} &bull; ${escapeHtml(step.questionId || `Q${idx + 1}`)}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; line-height: 1.4;">
              ${escapeHtml(step.questionTitle || step.questionId || "Question")}
            </div>
            <div style="background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #cbd5e1;">
              ${formatAnswerHtml(step.rawAnswer !== undefined ? step.rawAnswer : step.answerSummary)}
            </div>
          </div>
        `
        )
        .join("")
    : Object.entries(response.answers || {})
        .map(
          ([qKey, qVal]) => `
          <div style="margin-bottom: 12px; padding: 12px 14px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; margin-bottom: 4px;">${escapeHtml(
              qKey
            )}</div>
            <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1;">
              ${formatAnswerHtml(qVal)}
            </div>
          </div>
        `
        )
        .join("");

  const answersListText = hasValidPath
    ? (response.survey_path as any[])
        .map(
          (step, idx) =>
            `Question ${step.stepNumber || idx + 1} (${step.questionId || `Q${idx + 1}`}): ${step.questionTitle || "Question"}\nAnswer: ${formatAnswerText(
              step.rawAnswer !== undefined ? step.rawAnswer : step.answerSummary
            )}\n`
        )
        .join("\n")
    : Object.entries(response.answers || {})
        .map(([qKey, qVal]) => `${qKey}: ${formatAnswerText(qVal)}`)
        .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHtml(subject)}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px -2px rgba(0,0,0,0.06); }
          .header { background-color: #0b132b; color: #ffffff; padding: 28px 24px; }
          .badge { display: inline-block; padding: 4px 12px; background-color: #0d9488; color: #ffffff; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; }
          .header p { margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; }
          .content { padding: 28px 24px; }
          .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.7px; margin-top: 24px; margin-bottom: 12px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          .info-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
          .info-table td.label { width: 160px; color: #64748b; font-weight: 600; background: #f8fafc; }
          .info-table td.val { color: #0f172a; font-weight: 700; }
          .footer { padding: 20px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">New Survey Submission</span>
            <h1>KOLABA CLOUD AI</h1>
            <p>Engineering Colleges AI &amp; GPU Infrastructure Survey</p>
          </div>
          <div class="content">
            <div class="section-title">Submission Details</div>
            <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #0f172a;">
              <strong>Date &amp; Time:</strong> ${submissionDate}<br/>
              <span style="font-size: 12px; color: #64748b; font-family: monospace;">Response ID: ${escapeHtml(
                response.id
              )}</span>
            </p>

            <div class="section-title">Respondent Profile</div>
            <table class="info-table">
              <tr>
                <td class="label">Respondent Track:</td>
                <td class="val"><span style="color: #0d9488; font-weight: 800;">${escapeHtml(
                  response.respondent_type_label || response.respondent_type
                )}</span></td>
              </tr>
              <tr>
                <td class="label">Full Name:</td>
                <td class="val">${escapeHtml(response.respondent_name || "N/A")}</td>
              </tr>
              <tr>
                <td class="label">College / Institute:</td>
                <td class="val">${escapeHtml(response.college || "Not Specified")}</td>
              </tr>
              ${
                response.department
                  ? `<tr><td class="label">Department:</td><td class="val">${escapeHtml(
                      response.department
                    )}</td></tr>`
                  : ""
              }
              ${
                response.role
                  ? `<tr><td class="label">Role / Designation:</td><td class="val">${escapeHtml(
                      response.role
                    )}</td></tr>`
                  : ""
              }
              <tr>
                <td class="label">Email Address:</td>
                <td class="val"><a href="mailto:${escapeHtml(
                  response.email
                )}" style="color: #0d9488; text-decoration: underline;">${escapeHtml(
                  response.email || "N/A"
                )}</a></td>
              </tr>
              <tr>
                <td class="label">Phone Number:</td>
                <td class="val">${escapeHtml(response.phone || "Not Provided")}</td>
              </tr>
              <tr>
                <td class="label">Consent Status:</td>
                <td class="val" style="color: ${
                  response.consent ? "#059669" : "#dc2626"
                }; font-weight: 700;">${
                  response.consent
                    ? "✓ Consent Provided (Agreed to contact & research data storage)"
                    : "✗ Consent Declined"
                }</td>
              </tr>
              ${
                response.pilot_interest
                  ? `<tr><td class="label">Pilot / Workshop Interest:</td><td class="val" style="color: #0f766e;">${formatAnswerHtml(
                      response.pilot_interest
                    )}</td></tr>`
                  : ""
              }
              ${
                response.time_spent_seconds
                  ? `<tr><td class="label">Time Spent on Survey:</td><td class="val">${Math.floor(
                      response.time_spent_seconds / 60
                    )}m ${response.time_spent_seconds % 60}s</td></tr>`
                  : ""
              }
            </table>

            <div class="section-title">All Survey Answers (${
              response.survey_path?.length || Object.keys(response.answers || {}).length
            } Questions Recorded)</div>
            ${answersListHtml}
          </div>

          <div class="footer">
            <strong>Kolaba Cloud AI</strong> &bull; Enterprise AI Infrastructure for Engineering Institutions<br/>
            Email: <a href="mailto:info@kolabacloud.com" style="color: #0d9488;">info@kolabacloud.com</a> &bull; Phone: +91 93807 93114 &bull; Bengaluru, Karnataka, India<br/>
            <em>This automated notification was generated directly upon survey submission.</em>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
============================================================
NEW SURVEY RESPONSE — KOLABA CLOUD AI
============================================================

SUBMISSION METADATA
------------------------------------------------------------
Response ID: ${response.id}
Date & Time: ${submissionDate}
Time Spent:  ${Math.floor((response.time_spent_seconds || 0) / 60)}m ${(response.time_spent_seconds || 0) % 60}s

RESPONDENT INFORMATION
------------------------------------------------------------
Track:       ${response.respondent_type_label || response.respondent_type}
Name:        ${response.respondent_name || "N/A"}
College:     ${response.college || "N/A"}
${response.department ? `Department:  ${response.department}\n` : ""}${response.role ? `Role:        ${response.role}\n` : ""}Email:       ${response.email || "N/A"}
Phone:       ${response.phone || "Not Provided"}
Consent:     ${response.consent ? "Yes (Agreed to contact & storage)" : "No"}
Pilot:       ${formatAnswerText(response.pilot_interest)}

============================================================
RECORDED SURVEY ANSWERS
============================================================
${answersListText}

============================================================
Kolaba Cloud AI • info@kolabacloud.com • +91 93807 93114
Bengaluru, Karnataka, India
============================================================
`;

  return { subject, html, text };
}

// Master email dispatch function
export async function sendSurveyEmail(response: SurveyResponse): Promise<{
  success: boolean;
  method: string;
  messageId?: string;
  error?: string;
}> {
  const { subject, html, text } = generateEmailContent(response);

  // 1. Try Nodemailer / SMTP (Gmail App Password or SMTP server) if configured
  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Kolaba Survey System" <${emailUser}>`,
        to: recipientEmail,
        subject: subject,
        text: text,
        html: html,
        replyTo: response.email || undefined,
      });

      console.log(`[Email Sent via SMTP] MessageId: ${info.messageId} to ${recipientEmail}`);
      return { success: true, method: "smtp", messageId: info.messageId };
    } catch (err: any) {
      console.error("[Email Error - SMTP]", err);
      // If Resend is also configured, fall through to Resend
      if (!isResendConfigured) {
        return { success: false, method: "smtp", error: err.message || "SMTP transmission failed" };
      }
    }
  }

  // 2. Try Resend if configured
  if (isResendConfigured && resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: "Kolaba Survey <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: subject,
        text: text,
        html: html,
        replyTo: response.email || undefined,
      });

      console.log(`[Email Sent via Resend] ID: ${data.data?.id} to ${recipientEmail}`);
      return { success: true, method: "resend", messageId: data.data?.id };
    } catch (err: any) {
      console.error("[Email Error - Resend]", err);
      return { success: false, method: "resend", error: err.message || "Resend transmission failed" };
    }
  }

  // 3. Fallback for Local Development without SMTP credentials configured yet
  console.log("------------------------------------------------------------------");
  console.log(`[Email System Notice] Neither EMAIL_USER/EMAIL_PASSWORD nor RESEND_API_KEY is configured.`);
  console.log(`To receive real emails in ${recipientEmail}, set in .env.local:`);
  console.log(`EMAIL_USER=your-gmail@gmail.com`);
  console.log(`EMAIL_PASSWORD=your-16-char-gmail-app-password`);
  console.log(`RECIPIENT_EMAIL=${recipientEmail}`);
  console.log(`------------------------------------------------------------------`);
  console.log(`SIMULATED EMAIL DISPATCH TO: ${recipientEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body Summary:\n${text.substring(0, 450)}...\n`);
  console.log("------------------------------------------------------------------");

  return { success: true, method: "local-simulation" };
}
