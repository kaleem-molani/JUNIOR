import nodemailer from 'nodemailer';

// Create transporter for sending emails
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'OnClick Trading'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export function generatePasswordResetEmail(resetUrl: string, userEmail: string): EmailOptions {
  const subject = 'Reset Your Password - OnClick Trading';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OnClick Trading</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>You have requested to reset your password for your OnClick Trading account (${userEmail}).</p>
          <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>For security reasons, this link will expire in 1 hour.</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${userEmail}. If you have any questions, please contact our support team.</p>
          <p>&copy; 2024 OnClick Trading. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Reset Your Password - OnClick Trading

    You have requested to reset your password for your OnClick Trading account (${userEmail}).

    Please visit this link to reset your password: ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this password reset, please ignore this email.

    For security reasons, this link will expire in 1 hour.
  `;

  return {
    to: userEmail,
    subject,
    html,
    text,
  };
}