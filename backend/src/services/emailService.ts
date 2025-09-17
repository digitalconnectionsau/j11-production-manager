// Basic email service for development
// In production, this would integrate with a real email service like SendGrid, AWS SES, etc.

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  // In development, just log the reset link instead of sending actual emails
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  console.log('📧 Password Reset Email (Development Mode)');
  console.log('To:', to);
  console.log('Reset URL:', resetUrl);
  console.log('Token:', resetToken);
  console.log('---');
  
  // In production, you would implement actual email sending here:
  // - Configure email service (SendGrid, AWS SES, Nodemailer, etc.)
  // - Send HTML email with proper styling
  // - Handle email delivery errors
  
  // For now, simulate async email sending
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Mock email sent to ${to}`);
      resolve();
    }, 100);
  });
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // Generic email sending function for future use
  console.log('📧 Email (Development Mode)');
  console.log('To:', options.to);
  console.log('Subject:', options.subject);
  console.log('HTML:', options.html);
  if (options.text) {
    console.log('Text:', options.text);
  }
  console.log('---');
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`✅ Mock email sent to ${options.to}`);
      resolve();
    }, 100);
  });
}
