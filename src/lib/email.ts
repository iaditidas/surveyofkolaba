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

// Format structured answer text
function formatAnswerValue(val: any): string {
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
        lines.push(`${cleanKey}: ${Array.isArray(v) ? v.join(", ") : v}`);
      }
    }
    return lines.length > 0 ? lines.join(" | ") : "N/A";
  }
  return String(val);
}

// Build complete HTML & Plain text email bodies
export function generateEmailContent(response: SurveyResponse) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminResponseUrl = `${appUrl}/admin/responses/${response.id}`;
  const submissionDate = new Date(response.created_at || Date.now()).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const subject = `New Survey Response — Kolaba Cloud AI [${response.respondent_type_label || "Engineering College"} - ${response.college || "General"}]`;

  // Build survey answers formatted list
  const answersListHtml = response.survey_path && response.survey_path.length > 0
    ? response.survey_path
        .map((step, idx) => `
          <div style="margin-bottom: 14px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; margin-bottom: 4px;">
              Question ${step.stepNumber || idx + 1} (${step.questionId})
            </div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">
              ${step.questionTitle}
            </div>
            <div style="font-size: 13px; color: #334155; line-height: 1.5; background: #ffffff; padding: 8px 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
              ${formatAnswerValue(step.rawAnswer !== undefined ? step.rawAnswer : step.answerSummary)}
            </div>
          </div>
        `)
        .join("")
    : Object.entries(response.answers || {})
        .map(([qKey, qVal], idx) => `
          <div style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
            <div style="font-size: 11px; font-weight: 700; color: #64748b;">${qKey}</div>
            <div style="font-size: 13px; color: #0f172a; font-weight: 500;">${formatAnswerValue(qVal)}</div>
          </div>
        `)
        .join("");

  const answersListText = response.survey_path && response.survey_path.length > 0
    ? response.survey_path
        .map((step, idx) => `Question ${step.stepNumber || idx + 1} (${step.questionId}): ${step.questionTitle}\nAnswer: ${formatAnswerValue(step.rawAnswer !== undefined ? step.rawAnswer : step.answerSummary)}\n`)
        .join("\n")
    : Object.entries(response.answers || {})
        .map(([qKey, qVal]) => `${qKey}: ${formatAnswerValue(qVal)}`)
        .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #0b132b; color: #ffffff; padding: 28px 24px; }
          .badge { display: inline-block; padding: 4px 10px; background-color: #0d9488; color: #ffffff; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; }
          .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; }
          .content { padding: 24px; }
          .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #f1f5f9; padding-bottom: 4px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
          .info-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
          .info-table td.label { width: 140px; color: #64748b; font-weight: 600; }
          .info-table td.val { color: #0f172a; font-weight: 700; }
          .btn-container { text-align: center; margin: 28px 0 10px; }
          .btn { display: inline-block; background-color: #0b132b; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 13px; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">New Survey Submission</span>
            <h1>KOLABA CLOUD AI</h1>
            <p>Engineering Colleges AI & GPU Infrastructure Survey</p>
          </div>
          <div class="content">
            <div class="section-title">Submitted At</div>
            <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0f172a;">${submissionDate}</p>

            <div class="section-title">Respondent Information</div>
            <table class="info-table">
              <tr>
                <td class="label">Respondent Track:</td>
                <td class="val">${response.respondent_type_label}</td>
              </tr>
              <tr>
                <td class="label">Full Name:</td>
                <td class="val">${response.respondent_name || "N/A"}</td>
              </tr>
              <tr>
                <td class="label">College / Institute:</td>
                <td class="val">${response.college || "N/A"}</td>
              </tr>
              ${response.department ? `<tr><td class="label">Department:</td><td class="val">${response.department}</td></tr>` : ""}
              ${response.role ? `<tr><td class="label">Role:</td><td class="val">${response.role}</td></tr>` : ""}
              <tr>
                <td class="label">Email Address:</td>
                <td class="val"><a href="mailto:${response.email}" style="color: #0d9488;">${response.email || "N/A"}</a></td>
              </tr>
              <tr>
                <td class="label">Phone Number:</td>
                <td class="val">${response.phone || "N/A"}</td>
              </tr>
              <tr>
                <td class="label">Consent Provided:</td>
                <td class="val" style="color: ${response.consent ? "#059669" : "#dc2626"};">${response.consent ? "Yes (Agreed to contact & storage)" : "No"}</td>
              </tr>
              ${response.pilot_interest ? `<tr><td class="label">Pilot Interest:</td><td class="val" style="color: #0d9488;">${formatAnswerValue(response.pilot_interest)}</td></tr>` : ""}
            </table>

            <div class="section-title">Survey Answers (${response.survey_path?.length || 0} Questions Captured)</div>
            ${answersListHtml}

            <div class="btn-container">
              <a href="${adminResponseUrl}" class="btn" target="_blank">View Response in Admin Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            Kolaba Cloud AI • info@kolabacloud.com • +91 93807 93114<br/>
            Bengaluru, Karnataka, India
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
========================================
NEW SURVEY RESPONSE — KOLABA CLOUD AI
========================================

Submitted At:
${submissionDate}

RESPONDENT INFORMATION
----------------------
Track: ${response.respondent_type_label}
Name: ${response.respondent_name || "N/A"}
College: ${response.college || "N/A"}
${response.department ? `Department: ${response.department}\n` : ""}${response.role ? `Role: ${response.role}\n` : ""}Email: ${response.email || "N/A"}
Phone: ${response.phone || "N/A"}
Consent: ${response.consent ? "Yes" : "No"}
Pilot Interest: ${formatAnswerValue(response.pilot_interest)}

SURVEY ANSWERS
--------------
${answersListText}

----------------------
View in Admin Dashboard: ${adminResponseUrl}
Submission ID: ${response.id}
========================================
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
