export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// SMTP2Go REST API configuration
const SMTP2GO_API_URL = 'https://api.smtp2go.com/v3/email/send';

async function sendViaAPI(options: EmailOptions): Promise<void> {
  if (!process.env.SMTP_PASS) {
    throw new Error('SMTP2Go API key not configured. Please check SMTP_PASS environment variable.');
  }

  const emailData = {
    api_key: process.env.SMTP_PASS,
    to: [options.to],
    sender: process.env.FROM_EMAIL || 'j11@digitalconnections.au',
    subject: options.subject,
    text_body: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    html_body: options.html
  };

  try {
    const response = await fetch(SMTP2GO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();
    
    if (response.ok && result.data?.succeeded) {
      console.log(`✅ Email sent successfully to ${options.to}`);
      console.log(`Email ID: ${result.data.email_id}`);
    } else {
      console.error('SMTP2Go API error:', result);
      throw new Error(`SMTP2Go API failed: ${result.data?.failures?.[0]?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ Failed to send email via SMTP2Go API:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  // Check if we should send real emails or just log
  const shouldSendEmail = process.env.EMAIL_MODE === 'production' || process.env.NODE_ENV === 'production';
  
  if (!shouldSendEmail) {
    // Development mode - just log
    console.log('📧 Password Reset Email (Development Mode)');
    console.log('To:', to);
    console.log('Reset URL:', resetUrl);
    console.log('Token:', resetToken);
    console.log('---');
    console.log(`✅ Mock email logged for ${to}`);
    return;
  }

  // Production mode - send actual email via SMTP2Go API
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: white; padding: 30px; border: 1px solid #e9ecef; }
          .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 8px 8px; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #007bff;">J11 Production Manager</h1>
            <p style="margin: 10px 0 0 0;">Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have requested to reset your password for your J11 Production Manager account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <strong>Important:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in 1 hour for security reasons</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>This email was sent by J11 Production Manager. If you have any questions, please contact support.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      J11 Production Manager - Password Reset Request

      Hello,

      You have requested to reset your password for your J11 Production Manager account.

      Click this link to reset your password: ${resetUrl}

      Important:
      - This link will expire in 1 hour for security reasons
      - If you didn't request this reset, please ignore this email
      - Never share this link with anyone

      If you have any questions, please contact support.
    `;

    await sendViaAPI({
      to: to,
      subject: 'Password Reset Request - J11 Production Manager',
      html: htmlContent,
      text: textContent,
    });
    
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email. Please try again later.');
  }
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Check if we should send real emails or just log
  const shouldSendEmail = process.env.EMAIL_MODE === 'production' || process.env.NODE_ENV === 'production';
  
  if (!shouldSendEmail) {
    // Development mode - just log
    console.log('📧 Email (Development Mode)');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('HTML:', options.html.substring(0, 200) + '...');
    if (options.text) {
      console.log('Text:', options.text.substring(0, 200) + '...');
    }
    console.log('---');
    console.log(`✅ Mock email logged for ${options.to}`);
    return;
  }

  // Production mode - send actual email via SMTP2Go API
  try {
    await sendViaAPI(options);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}
