import nodemailer from 'nodemailer'

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
})

// Send welcome email to new member
export async function sendWelcomeEmail({
  to,
  businessName,
  tempPassword,
}: {
  to: string
  businessName: string
  tempPassword: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: 'Welcome to North Country Chamber of Commerce!',
    text: `
Dear ${businessName},

Thank you for joining the North Country Chamber of Commerce! Your membership is now active.

Login Credentials:
Email: ${to}
Temporary Password: ${tempPassword}

Member Portal: ${baseUrl}/portal

Please login and change your password immediately.

From the member portal, you can:
- Update your business profile
- Create and manage events
- View your membership status
- Renew your membership

If you have any questions, please don't hesitate to contact us.

Welcome aboard!

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; }
    .credentials { background-color: white; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to the Chamber!</h1>
    </div>
    <div class="content">
      <p>Dear ${businessName},</p>

      <p>Thank you for joining the North Country Chamber of Commerce! Your membership is now active.</p>

      <div class="credentials">
        <h3>Login Credentials</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
      </div>

      <p style="text-align: center;">
        <a href="${baseUrl}/portal" class="button">Access Member Portal</a>
      </p>

      <p><strong>Please login and change your password immediately.</strong></p>

      <p>From the member portal, you can:</p>
      <ul>
        <li>Update your business profile</li>
        <li>Create and manage events</li>
        <li>View your membership status</li>
        <li>Renew your membership</li>
      </ul>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Welcome aboard!</p>

      <p><strong>North Country Chamber of Commerce</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send event approval notification to admins/chamber staff
export async function sendEventApprovalNotification({
  eventId,
  eventTitle,
  eventDate,
  businessName,
  submitterEmail,
  adminEmails,
}: {
  eventId: number
  eventTitle: string
  eventDate: string
  businessName: string
  submitterEmail: string
  adminEmails: string[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const adminUrl = `${baseUrl}/admin/collections/events/${eventId}`
  const approveUrl = `${baseUrl}/api/events/approve?id=${eventId}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to: adminEmails.join(', '),
    subject: `New Event Awaiting Approval: ${eventTitle}`,
    text: `
A new event has been submitted and is awaiting approval.

Event: ${eventTitle}
Date: ${new Date(eventDate).toLocaleDateString()}
Business: ${businessName}
Submitted by: ${submitterEmail}

Review and approve: ${adminUrl}

Quick approve: ${approveUrl}

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; }
    .event-details { background-color: white; border: 2px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 10px 10px 0; }
    .button-approve { background-color: #16a34a; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Event Awaiting Approval</h1>
    </div>
    <div class="content">
      <p>A new event has been submitted and is awaiting approval.</p>

      <div class="event-details">
        <h3>${eventTitle}</h3>
        <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Business:</strong> ${businessName}</p>
        <p><strong>Submitted by:</strong> ${submitterEmail}</p>
      </div>

      <p style="text-align: center;">
        <a href="${approveUrl}" class="button button-approve">Quick Approve</a>
        <a href="${adminUrl}" class="button">Review & Edit</a>
      </p>

      <p style="font-size: 12px; color: #6b7280;">Click "Quick Approve" to publish immediately, or "Review & Edit" to view full details and make changes.</p>

      <p><strong>North Country Chamber of Commerce</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send password reset email
export async function sendPasswordResetEmail({
  to,
  name,
  resetToken,
}: {
  to: string
  name: string
  resetToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/admin/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: 'Reset Your Password - North Country Chamber',
    text: `
Hi ${name},

You requested to reset your password for the North Country Chamber of Commerce member portal.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>

      <p>You requested to reset your password for the North Country Chamber of Commerce member portal.</p>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <p><strong>This link will expire in 1 hour.</strong></p>

      <p>If you didn't request this, please ignore this email.</p>

      <p><strong>North Country Chamber of Commerce</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}
