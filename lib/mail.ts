import nodemailer from 'nodemailer';

// CONFIGURE YOUR SMTP HERE (GMAIL, SENDGRID, ETC.)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASS, // Your App Password
  },
});

export async function sendVotingConfirmation(to: string, campaignName: string, voterName: string) {
  if (!to) return;

  try {
    const info = await transporter.sendMail({
      from: `"Pragya General Election System 2026" <${process.env.SMTP_USER}>`,
      to: to,
      subject: `Confirmation: Your Vote for ${campaignName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
          <div style="background: #2563eb; padding: 40px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Vote Recorded Successfully</h1>
          </div>
          <div style="padding: 40px; color: #0f172a; line-height: 1.6;">
            <p style="font-size: 18px;">Hello <strong>${voterName}</strong>,</p>
            <p>This is an automated confirmation that your vote has been securely cast in the <strong>${campaignName}</strong> election.</p>
            <p>Your participation ensures a fair and transparent democratic process. Thank you for making your voice heard!</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
              This is a system-generated email. Please do not reply.
            </div>
          </div>
        </div>
      `,
    });
    console.log("✉️ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
  }
}
