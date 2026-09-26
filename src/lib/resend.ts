import { Resend } from "resend";
import { SurveyResponse } from "@/types/survey";

const resendApiKey = process.env.RESEND_API_KEY;
const recipientEmail =
  process.env.RECIPIENT_EMAIL ||
  process.env.SURVEY_NOTIFICATION_EMAIL ||
  "aditidas2486@gmail.com";

export const isResendConfigured = Boolean(
  resendApiKey && resendApiKey.startsWith("re_")
);

export const resend = isResendConfigured ? new Resend(resendApiKey) : null;

export async function sendSurveyNotificationEmail(response: SurveyResponse) {
  const subject = `[Kolaba Survey] New ${response.respondent_type_label} Response — ${response.respondent_name} (${response.college || "Engineering College"})`;

  // Extract key summary points from the path
  const keyPoints = (response.survey_path || [])
    .filter(
      (step) =>
        step.answerSummary &&
        step.answerSummary !== "N/A" &&
        step.questionTitle
    )
    .map(
      (step) => `• <strong>${step.questionTitle}:</strong> ${step.answerSummary}`
    )
    .join("<br/>");

  const plainKeyPoints = (response.survey_path || [])
    .filter(
      (step) =>
        step.answerSummary &&
        step.answerSummary !== "N/A" &&
        step.questionTitle
    )
    .map((step) => `- ${step.questionTitle}: ${step.answerSummary}`)
    .join("\n");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background-color: #0b132b; color: #ffffff; padding: 28px 24px; text-align: left; }
          .badge { display: inline-block; padding: 4px 10px; background-color: #0d9488; color: #ffffff; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
          .header p { margin: 4px 0 0 0; color: #94a3b8; font-size: 14px; }
          .content { padding: 24px; }
          .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
          .info-grid { background-color: #f8fafc; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; border: 1px solid #e2e8f0; }
          .info-row { display: flex; margin-bottom: 6px; font-size: 14px; }
          .info-label { width: 130px; color: #64748b; font-weight: 500; }
          .info-value { font-weight: 600; color: #0f172a; }
          .answers-box { font-size: 14px; line-height: 1.6; color: #334155; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span class="badge">New Survey Response</span>
            <h1>KOLABA CLOUD AI</h1>
            <p>Engineering Colleges AI Infrastructure Research</p>
          </div>
          <div class="content">
            <div class="section-title">Respondent Overview</div>
            <div class="info-grid">
              <div class="info-row"><span class="info-label">Respondent:</span> <span class="info-value">${response.respondent_type_label}</span></div>
              <div class="info-row"><span class="info-label">College:</span> <span class="info-value">${response.college || "N/A"}</span></div>
              ${response.department ? `<div class="info-row"><span class="info-label">Department:</span> <span class="info-value">${response.department}</span></div>` : ""}
              ${response.role ? `<div class="info-row"><span class="info-label">Role:</span> <span class="info-value">${response.role}</span></div>` : ""}
            </div>

            <div class="section-title">Contact & Consent</div>
            <div class="info-grid">
              <div class="info-row"><span class="info-label">Name:</span> <span class="info-value">${response.respondent_name || "N/A"}</span></div>
              <div class="info-row"><span class="info-label">Email:</span> <span class="info-value">${response.email || "N/A"}</span></div>
              <div class="info-row"><span class="info-label">Phone:</span> <span class="info-value">${response.phone || "N/A"}</span></div>
              <div class="info-row"><span class="info-label">Consent Given:</span> <span class="info-value" style="color: #059669;">${response.consent ? "Yes (Agreed to contact & storage)" : "No"}</span></div>
            </div>

            <div class="section-title">Recorded Responses (${response.survey_path?.length || 0} questions answered)</div>
            <div class="answers-box">
              ${keyPoints || "<em>No detailed answers captured</em>"}
            </div>
          </div>
          <div class="footer">
            Kolaba Cloud AI • Enterprise AI Infrastructure • Bengaluru, India<br/>
            Received at ${new Date(response.created_at || Date.now()).toLocaleString("en-IN")}
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
KOLABA CLOUD AI
New Survey Response

Respondent:
${response.respondent_type_label}

College:
${response.college || "N/A"}

${response.department ? `Department:\n${response.department}\n` : ""}${response.role ? `Role:\n${response.role}\n` : ""}
Contact:
Name: ${response.respondent_name || "N/A"}
Email: ${response.email || "N/A"}
Phone: ${response.phone || "N/A"}

Consent:
${response.consent ? "Yes" : "No"}

Key responses:
${plainKeyPoints}
`;

  if (!isResendConfigured || !resend) {
    console.log(
      `[Resend Notice] RESEND_API_KEY is not configured. Email to ${recipientEmail} logged below:`
    );
    console.log("Subject:", subject);
    console.log("Text Body:\n", textContent);
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Kolaba Survey <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: subject,
      html: htmlContent,
      text: textContent,
      replyTo: response.email || undefined,
    });
    return { success: true, data };
  } catch (error) {
    console.error("[Resend Error] Failed to send survey email:", error);
    return { success: false, error };
  }
}
