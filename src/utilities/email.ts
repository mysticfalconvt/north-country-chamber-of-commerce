import nodemailer from 'nodemailer'
import { escapeHtml } from './sanitize'

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

// Common email styles and header with logo
const getEmailStyles = () => `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .logo-header { text-align: center; padding: 30px 20px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; }
  .logo-header img { max-width: 150px; height: auto; }
  .content { padding: 30px 20px; background-color: #ffffff; }
  .footer { text-align: center; padding: 20px; background-color: #f9fafb; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  .button { display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  .button-green { background-color: #16a34a; }
  .info-box { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
  a { color: #1e3a5f; }
  ul { padding-left: 20px; }
  h1, h2, h3 { color: #1f2937; }
`

const getLogoHeader = (baseUrl: string) => `
  <div class="logo-header">
    <a href="${baseUrl}">
      <img src="${baseUrl}/north-country-chamber-logo.png" alt="North Country Chamber of Commerce" style="max-width: 150px; height: auto;" />
    </a>
  </div>
`

const getFooter = () => `
  <div class="footer">
    <p style="margin: 5px 0;"><strong>North Country Chamber of Commerce</strong></p>
    <p style="margin: 5px 0;">Newport, Vermont</p>
    <p style="margin: 10px 0;">© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
  </div>
`

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
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Welcome to the Chamber!</h1>

      <p>Dear ${escapeHtml(businessName)},</p>

      <p>Thank you for joining the North Country Chamber of Commerce! Your membership is now active.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">Login Credentials</h3>
        <p><strong>Email:</strong> ${to}</p>
        <p style="margin-bottom: 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
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
    </div>
    ${getFooter()}
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
  const approveUrl = `${baseUrl}/approve/event/${eventId}`

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

Quick approve: ${approveUrl}
Review in admin: ${adminUrl}

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">New Event Awaiting Approval</h1>

      <p>A new event has been submitted and is awaiting approval.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(eventTitle)}</h3>
        <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Business:</strong> ${escapeHtml(businessName)}</p>
        <p style="margin-bottom: 0;"><strong>Submitted by:</strong> ${escapeHtml(submitterEmail)}</p>
      </div>

      <p style="text-align: center;">
        <a href="${approveUrl}" class="button button-green">Quick Approve</a>
        <a href="${adminUrl}" class="button" style="margin-left: 10px;">Review & Edit</a>
      </p>

      <p style="font-size: 12px; color: #6b7280; text-align: center;">Click "Quick Approve" to view details and approve, or "Review & Edit" to access the admin panel.</p>
    </div>
    ${getFooter()}
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
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Reset Your Password</h1>

      <p>Hi ${escapeHtml(name)},</p>

      <p>You requested to reset your password for the North Country Chamber of Commerce member portal.</p>

      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <p><strong>This link will expire in 1 hour.</strong></p>

      <p>If you didn't request this, please ignore this email.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send business application approval notification to admins
export async function sendBusinessApprovalNotification({
  businessId,
  businessName,
  tier,
  contactEmail,
  contactName,
  adminEmails,
}: {
  businessId: number
  businessName: string
  tier: string
  contactEmail: string
  contactName: string
  adminEmails: string[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const reviewUrl = `${baseUrl}/admin/collections/businesses/${businessId}`
  const approveUrl = `${baseUrl}/approve/${businessId}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to: adminEmails.join(', '),
    subject: `New Business Membership Application: ${businessName}`,
    text: `
A new business has applied for chamber membership.

Business: ${businessName}
Contact: ${contactName}
Email: ${contactEmail}
Tier: ${tier}

Quick approve: ${approveUrl}
Review in admin: ${reviewUrl}

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">New Business Application</h1>

      <p>A new business has applied for chamber membership and requires approval.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(businessName)}</h3>
        <p><strong>Contact:</strong> ${escapeHtml(contactName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(contactEmail)}</p>
        <p style="margin-bottom: 0;"><strong>Membership Tier:</strong> ${escapeHtml(tier)}</p>
      </div>

      <p style="text-align: center;">
        <a href="${approveUrl}" class="button button-green">Quick Approve</a>
        <a href="${reviewUrl}" class="button" style="margin-left: 10px;">Review & Edit</a>
      </p>

      <p style="font-size: 12px; color: #6b7280; text-align: center;">Click "Quick Approve" to view details and approve, or "Review & Edit" to access the admin panel.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send rejection email to business applicant
export async function sendBusinessRejectedEmail({
  to,
  businessName,
  reason,
}: {
  to: string
  businessName: string
  reason?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: 'Chamber Membership Application Update',
    text: `
Dear ${businessName},

Thank you for your interest in joining the North Country Chamber of Commerce.

After reviewing your application, we are unable to approve your membership at this time.

${reason ? `Reason: ${reason}` : ''}

If you have any questions or would like to discuss this further, please contact us.

Thank you,
North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Application Update</h1>

      <p>Dear ${escapeHtml(businessName)},</p>

      <p>Thank you for your interest in joining the North Country Chamber of Commerce.</p>

      <p>After reviewing your application, we are unable to approve your membership at this time.</p>

      ${reason ? `<div class="info-box" style="background-color: #fef2f2; border-color: #fecaca;"><p style="margin: 0;"><strong>Reason:</strong> ${escapeHtml(reason)}</p></div>` : ''}

      <p>If you have any questions or would like to discuss this further, please contact us.</p>

      <p>Thank you</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send application received email to applicant with their credentials
export async function sendApplicationReceivedEmail({
  to,
  businessName,
  contactName,
  tempPassword,
  tier,
  tierPrice,
}: {
  to: string
  businessName: string
  contactName: string
  tempPassword: string
  tier: string
  tierPrice: number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const portalUrl = `${baseUrl}/portal`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: 'Application Received - North Country Chamber of Commerce',
    text: `
Dear ${contactName},

Thank you for submitting your membership application for ${businessName}!

Your application is now pending review by our chamber staff. You'll receive another email once your application has been approved.

In the meantime, we've created an account for you so you can access the member portal once approved.

Login Credentials:
Email: ${to}
Temporary Password: ${tempPassword}

Member Portal: ${portalUrl}

Please save these credentials - you'll need them to log in after approval.

Application Details:
Business Name: ${businessName}
Membership Tier: ${tier}
Annual Dues: $${tierPrice}

Payment Information:
After approval, please mail your check to:
Vermont's North Country Chamber of Commerce
246 Causeway
Newport, VT 05855

Please include your business name in the memo line of the check.

If you have any questions, please don't hesitate to contact us.

Thank you,
North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Application Received!</h1>

      <p>Dear ${escapeHtml(contactName)},</p>

      <p>Thank you for submitting your membership application for <strong>${escapeHtml(businessName)}</strong>!</p>

      <p>Your application is now pending review by our chamber staff. You'll receive another email once your application has been approved.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">Your Login Credentials</h3>
        <p>We've created an account for you. Save these credentials for when your application is approved:</p>
        <p><strong>Email:</strong> ${to}</p>
        <p style="margin-bottom: 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0;">Application Details</h3>
        <p><strong>Business Name:</strong> ${escapeHtml(businessName)}</p>
        <p><strong>Membership Tier:</strong> ${escapeHtml(tier)}</p>
        <p style="margin-bottom: 0;"><strong>Annual Dues:</strong> $${tierPrice}</p>
      </div>

      <div class="info-box" style="background-color: #f0f9ff; border-color: #bae6fd;">
        <h3 style="margin-top: 0;">Payment Information</h3>
        <p>After approval, please mail your check to:</p>
        <p style="margin: 10px 0;">
          <strong>Vermont's North Country Chamber of Commerce</strong><br>
          246 Causeway<br>
          Newport, VT 05855
        </p>
        <p style="margin-bottom: 0; font-size: 14px; color: #6b7280;">Please include your business name in the memo line of the check.</p>
      </div>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Thank you!</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}


// Helper function to render rich text to HTML
const renderRichTextToHTML = (richText: any): string => {
  if (!richText || !richText.root || !richText.root.children) return ''

  const renderNode = (node: any): string => {
    if (node.type === 'text') {
      let text = node.text || ''
      if (node.bold) text = `<strong>${text}</strong>`
      if (node.italic) text = `<em>${text}</em>`
      if (node.underline) text = `<u>${text}</u>`
      return text
    }

    if (node.type === 'paragraph') {
      const content = node.children?.map(renderNode).join('') || ''
      return `<p>${content}</p>`
    }

    if (node.type === 'heading') {
      const content = node.children?.map(renderNode).join('') || ''
      const tag = node.tag || 'h2'
      return `<${tag}>${content}</${tag}>`
    }

    if (node.type === 'link') {
      const content = node.children?.map(renderNode).join('') || ''
      const url = node.url || '#'
      return `<a href="${url}" style="color: #1e3a5f; text-decoration: underline;">${content}</a>`
    }

    if (node.children && Array.isArray(node.children)) {
      return node.children.map(renderNode).join('')
    }

    return ''
  }

  return richText.root.children.map(renderNode).join('')
}

// Send newsletter email to subscriber
export async function sendNewsletterEmail({
  to,
  announcement,
  events,
  unsubscribeToken,
}: {
  to: string
  announcement: any
  events: any[]
  unsubscribeToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`
  const viewOnlineUrl = `${baseUrl}/news/${announcement.slug}`

  const contentHTML = renderRichTextToHTML(announcement.content)

  // Get the image URL if available
  let imageHTML = ''
  if (announcement.image) {
    const imageUrl = typeof announcement.image === 'object' && announcement.image.url
      ? `${baseUrl}${announcement.image.url}`
      : null
    if (imageUrl) {
      imageHTML = `
        <div style="margin-bottom: 30px;">
          <img src="${imageUrl}" alt="${announcement.title}" style="width: 100%; max-width: 560px; height: auto; border-radius: 8px;" />
        </div>
      `
    }
  }

  const eventsHTML =
    events.length > 0
      ? `
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <h2 style="color: #1f2937; margin-bottom: 20px;">Upcoming Events</h2>
      ${events
        .map(
          (event) => `
        <div style="background-color: #f9fafb; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #1e3a5f;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${escapeHtml(event.title)}</h3>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
            <strong>Date:</strong> ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          ${event.startTime ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Time:</strong> ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}</p>` : ''}
          ${event.location ? `<p style="margin: 5px 0; color: #6b7280; font-size: 14px;"><strong>Location:</strong> ${escapeHtml(event.location)}</p>` : ''}
          <p style="margin-top: 10px;">
            <a href="${baseUrl}/events/${event.slug}" style="color: #1e3a5f; text-decoration: none; font-weight: 600;">Learn more →</a>
          </p>
        </div>
      `,
        )
        .join('')}
      <p style="text-align: center; margin-top: 20px;">
        <a href="${baseUrl}/events" style="color: #1e3a5f; text-decoration: none; font-weight: 600;">View all events →</a>
      </p>
    </div>
  `
      : ''

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: `${announcement.title} - North Country Chamber Newsletter`,
    text: `
${announcement.title}

${announcement.content ? JSON.stringify(announcement.content) : ''}

Read online: ${viewOnlineUrl}

${events.length > 0 ? `\nUpcoming Events:\n${events.map((e) => `- ${e.title} (${new Date(e.date).toLocaleDateString()})`).join('\n')}` : ''}

Unsubscribe: ${unsubscribeUrl}

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      ${imageHTML}

      <h1 style="color: #1f2937; margin-bottom: 10px;">${escapeHtml(announcement.title)}</h1>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">
        ${new Date(announcement.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      ${contentHTML}

      <p style="text-align: center; margin-top: 30px;">
        <a href="${viewOnlineUrl}" class="button">Read Full Article</a>
      </p>

      ${eventsHTML}
    </div>
    <div class="footer">
      <p style="margin: 10px 0;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from this list</a>
      </p>
      <p style="margin: 5px 0;"><strong>North Country Chamber of Commerce</strong></p>
      <p style="margin: 5px 0;">Newport, Vermont</p>
      <p style="margin: 10px 0;">© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send mailing list confirmation email
export async function sendMailingListConfirmation({
  to,
  name,
  unsubscribeToken,
}: {
  to: string
  name?: string
  unsubscribeToken: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: 'Welcome to Our Newsletter - North Country Chamber',
    text: `
${name ? `Hi ${name},` : 'Hello,'}

Thank you for subscribing to the North Country Chamber of Commerce newsletter!

You'll now receive updates about chamber news, events, and member spotlights.

If you ever wish to unsubscribe, you can do so here:
${unsubscribeUrl}

Thank you,
North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Welcome to Our Newsletter!</h1>

      <p>${name ? `Hi ${escapeHtml(name)},` : 'Hello,'}</p>

      <p>Thank you for subscribing to the North Country Chamber of Commerce newsletter!</p>

      <p>You'll now receive updates about:</p>
      <ul>
        <li>Chamber news and announcements</li>
        <li>Upcoming events and networking opportunities</li>
        <li>Member spotlights and success stories</li>
        <li>Community initiatives</li>
      </ul>

      <p>We're excited to keep you informed about everything happening in Vermont's Northeast Kingdom!</p>
    </div>
    <div class="footer">
      <p style="margin: 10px 0;">
        <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe from this list</a>
      </p>
      <p style="margin: 5px 0;"><strong>North Country Chamber of Commerce</strong></p>
      <p style="margin: 5px 0;">Newport, Vermont</p>
      <p style="margin: 10px 0;">© ${new Date().getFullYear()} North Country Chamber of Commerce. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send event submission confirmation to the submitter
export async function sendEventSubmissionConfirmation({
  to,
  eventTitle,
  eventDate,
  businessName,
}: {
  to: string
  eventTitle: string
  eventDate: string
  businessName: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: `Event Submitted: ${eventTitle}`,
    text: `
Thank you for submitting your event!

Event: ${eventTitle}
Date: ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Business: ${businessName}

Your event has been submitted and is now pending review by our chamber staff. You'll receive another email once your event has been approved and published.

If you have any questions, please don't hesitate to contact us.

Thank you,
North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Event Submitted!</h1>

      <p>Thank you for submitting your event!</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(eventTitle)}</h3>
        <p><strong>Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin-bottom: 0;"><strong>Business:</strong> ${escapeHtml(businessName)}</p>
      </div>

      <p>Your event has been submitted and is now pending review by our chamber staff. You'll receive another email once your event has been approved and published.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Thank you!</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send event approved notification to the submitter
export async function sendEventApprovedEmail({
  to,
  eventTitle,
  eventSlug,
}: {
  to: string
  eventTitle: string
  eventSlug: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const eventUrl = `${baseUrl}/events/${eventSlug}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: `Your Event is Published: ${eventTitle}`,
    text: `
Great news! Your event has been approved and is now published on our website.

Event: ${eventTitle}

View your event: ${eventUrl}

Your event is now visible to the public and will appear on our events calendar.

Thank you for being a member of the North Country Chamber of Commerce!

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Your Event is Published!</h1>

      <p>Great news! Your event has been approved and is now published on our website.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(eventTitle)}</h3>
        <p style="margin-bottom: 0;">Your event is now visible to the public and will appear on our events calendar.</p>
      </div>

      <p style="text-align: center;">
        <a href="${eventUrl}" class="button">View Your Event</a>
      </p>

      <p>Thank you for being a member of the North Country Chamber of Commerce!</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send benefit approval notification to admins/chamber staff
export async function sendBenefitApprovalNotification({
  benefitId,
  benefitTitle,
  businessName,
  submitterEmail,
  adminEmails,
}: {
  benefitId: number
  benefitTitle: string
  businessName: string
  submitterEmail: string
  adminEmails: string[]
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const adminUrl = `${baseUrl}/admin/collections/benefits/${benefitId}`
  const approveUrl = `${baseUrl}/approve/benefit/${benefitId}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to: adminEmails.join(', '),
    subject: `New Benefit Awaiting Approval: ${benefitTitle}`,
    text: `
A new member benefit has been submitted and is awaiting approval.

Benefit: ${benefitTitle}
Business: ${businessName}
Submitted by: ${submitterEmail}

Quick approve: ${approveUrl}
Review in admin: ${adminUrl}

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">New Benefit Awaiting Approval</h1>

      <p>A new member benefit has been submitted and is awaiting approval.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(benefitTitle)}</h3>
        <p><strong>Business:</strong> ${escapeHtml(businessName)}</p>
        <p style="margin-bottom: 0;"><strong>Submitted by:</strong> ${escapeHtml(submitterEmail)}</p>
      </div>

      <p style="text-align: center;">
        <a href="${approveUrl}" class="button button-green">Quick Approve</a>
        <a href="${adminUrl}" class="button" style="margin-left: 10px;">Review & Edit</a>
      </p>

      <p style="font-size: 12px; color: #6b7280; text-align: center;">Click "Quick Approve" to view details and approve, or "Review & Edit" to access the admin panel.</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send benefit submission confirmation to the submitter
export async function sendBenefitSubmissionConfirmation({
  to,
  benefitTitle,
  businessName,
}: {
  to: string
  benefitTitle: string
  businessName: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: `Benefit Submitted: ${benefitTitle}`,
    text: `
Thank you for submitting your member benefit!

Benefit: ${benefitTitle}
Business: ${businessName}

Your benefit has been submitted and is now pending review by our chamber staff. You'll receive another email once your benefit has been approved and published.

If you have any questions, please don't hesitate to contact us.

Thank you,
North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Benefit Submitted!</h1>

      <p>Thank you for submitting your member benefit!</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(benefitTitle)}</h3>
        <p style="margin-bottom: 0;"><strong>Business:</strong> ${escapeHtml(businessName)}</p>
      </div>

      <p>Your benefit has been submitted and is now pending review by our chamber staff. You'll receive another email once your benefit has been approved and published.</p>

      <p>If you have any questions, please don't hesitate to contact us.</p>

      <p>Thank you!</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}

// Send benefit approved notification to the submitter
export async function sendBenefitApprovedEmail({
  to,
  benefitTitle,
  benefitSlug,
}: {
  to: string
  benefitTitle: string
  benefitSlug: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const benefitUrl = `${baseUrl}/benefits/${benefitSlug}`

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@vtnorthcountry.org',
    to,
    subject: `Your Benefit is Published: ${benefitTitle}`,
    text: `
Great news! Your member benefit has been approved and is now published on our website.

Benefit: ${benefitTitle}

View your benefit: ${benefitUrl}

Your benefit is now visible to the public and will appear on our benefits page.

Thank you for being a member of the North Country Chamber of Commerce!

North Country Chamber of Commerce
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <style>${getEmailStyles()}</style>
</head>
<body>
  <div class="container">
    ${getLogoHeader(baseUrl)}
    <div class="content">
      <h1 style="text-align: center; margin-bottom: 30px;">Your Benefit is Published!</h1>

      <p>Great news! Your member benefit has been approved and is now published on our website.</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">${escapeHtml(benefitTitle)}</h3>
        <p style="margin-bottom: 0;">Your benefit is now visible to the public and will appear on our benefits page.</p>
      </div>

      <p style="text-align: center;">
        <a href="${benefitUrl}" class="button">View Your Benefit</a>
      </p>

      <p>Thank you for being a member of the North Country Chamber of Commerce!</p>
    </div>
    ${getFooter()}
  </div>
</body>
</html>
    `.trim(),
  })
}
