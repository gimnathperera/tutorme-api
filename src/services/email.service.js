const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const { Grade, Subject } = require('../models');
const telegramService = require('./telegram.service');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html) => {
  const msg = { from: config.email.from, to, subject, text, html };
  await transport.sendMail(msg);
};

const normalizeBaseUrl = (url) => String(url || '').replace(/\/+$/, '');

const LOGO_URL = `${config.app.userUrl}/Emale_template_logo.png`;
const ICON_URL = `${config.app.userUrl}/Email_template_icon.png`;

const buildEmailHtml = (bodyContent) => `
  <div style="background-color:#EFF5FF;padding:40px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,175,0.10);">

      <div style="background:linear-gradient(135deg,#235ED5,#3b7ef8);padding:28px 32px;text-align:center;">
        <img src="${LOGO_URL}" alt="Tuition Lanka" style="height:70px;max-width:280px;" />
      </div>

      <div style="background:#ffffff;padding:40px 40px 32px;">
        <div style="text-align:center;margin-bottom:28px;">
          <img src="${ICON_URL}" alt="" style="width:80px;height:80px;" />
        </div>
        ${bodyContent}
        <p style="color:#374151;font-size:14px;margin-top:32px;line-height:1.6;">
          Warm regards,<br/>
          <strong>Tuition Lanka Team</strong>
        </p>
      </div>

      <div style="background:#f8faff;border-top:1px solid #dbeafe;padding:20px 32px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          <a href="https://www.tuitionlanka.com" style="color:#235ED5;text-decoration:none;">www.tuitionlanka.com</a>
          &nbsp;|&nbsp;
          <a href="mailto:support.tuitionlanka@gmail.com" style="color:#235ED5;text-decoration:none;">support.tuitionlanka@gmail.com</a>
          &nbsp;|&nbsp;
          <span style="color:#374151;">+94 707491400</span>
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; 2026 - All right reserved by Tuition Lanka.</p>
      </div>

    </div>
  </div>
`;

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const resolveGradeName = async (gradeValue) => {
  if (!gradeValue) {
    return 'N/A';
  }

  if (typeof gradeValue === 'object' && gradeValue.title) {
    return gradeValue.title;
  }

  const gradeDoc = await Grade.findById(gradeValue).select('title').lean();
  return gradeDoc ? gradeDoc.title : gradeValue;
};

/**
 * Send reset password email (HTML + Text)
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token, appUrl = config.app.userUrl) => {
  try {
    const subject = 'Reset Your TuitionLanka Password';
    const resetPasswordUrl = `${normalizeBaseUrl(appUrl)}/reset-password?token=${token}`;

    const text = `
Hello,

We received a request to reset the password for your TuitionLanka account.

Reset your password using the link below:
${resetPasswordUrl}

If you didn’t request this, please ignore this email.
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Reset Your Password</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We received a request to reset the password for your <strong>TuitionLanka</strong> account.
        Click the button below to set a new password.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetPasswordUrl}"
           style="background-color:#235ED5;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
          Reset Password
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;">
        If the button above doesn’t work, copy and paste this link into your browser:<br/>
        <a href="${resetPasswordUrl}" style="color:#235ED5;word-break:break-all;">${resetPasswordUrl}</a>
      </p>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">If you did not request a password reset, please ignore this message.</p>
    `);

    await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send reset password email to ${to}:`, err);
    throw new Error('Email sending failed');
  }
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send temporary password email
 * @param {string} to
 * @param {string} username
 * @param {string} tempPassword
 * @returns {Promise}
 */
const sendTemporaryPasswordEmail = async (to, username, tempPassword) => {
  try {
    const safeUsername = escapeHtml(username || 'there');
    const safeTempPassword = escapeHtml(tempPassword || '');
    const subject = 'Your Temporary Password for TuitionLanka';
    const text = `
Hello ${username || 'there'},

Your temporary password for TuitionLanka is:

${tempPassword}

Please log in as soon as possible and change your password immediately.
Do not share this password with anyone.

If you did not request this, please contact support.

Thanks,
TuitionLanka Support Team`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Your Temporary Password</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Hello <strong>${safeUsername}</strong>,<br/>
        A temporary password has been generated for your account. Use it to log in once, then update it to a password only you know.
      </p>
      <div style="background:#EFF5FF;border:1px solid #bfdbfe;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;text-transform:uppercase;color:#235ED5;letter-spacing:0.04em;">Temporary Password</p>
        <div style="display:inline-block;background:#fff;border:1px dashed #60a5fa;border-radius:10px;padding:14px 24px;font-size:22px;font-weight:700;letter-spacing:0.08em;color:#235ED5;word-break:break-all;">
          ${safeTempPassword}
        </div>
      </div>
      <p style="color:#6b7280;font-size:13px;line-height:1.7;">
        <strong style="color:#374151;">Security notice:</strong> Log in immediately and change your password.
        Do not share this password with anyone. If you did not request this, contact support right away.
      </p>
    `);

    await sendEmail(to, subject, text, html);
  } catch (err) {
    logger.error(`Failed to send temporary password email to ${to}:`, err);
    throw new Error('Email sending failed');
  }
};

/**
 * Send tutor request acknowledgement email
 * @param {Object} requestTutorBody
 * @returns {Promise}
 */
const sendAcknowledgement = async (requestTutorBody) => {
  try {
    const { name, email, phoneNumber, district, city, medium, grade, tutors } = requestTutorBody;

    const emailSubject = 'Tutor Request Received – Tuition Lanka';

    // Resolve grade name
    let gradeName = 'N/A';
    if (grade) {
      const gradeDoc = await Grade.findById(grade).select('title').lean();
      if (gradeDoc) gradeName = gradeDoc.title;
    }

    // Collect all unique subject IDs across all tutor blocks
    const subjectIds = [
      ...new Set(
        tutors
          .slice(0, 4)
          .map((t) => t.subject)
          .filter(Boolean)
      ),
    ];
    const subjectDocs = await Subject.find({ _id: { $in: subjectIds } })
      .select('_id title')
      .lean();
    const subjectMap = Object.fromEntries(subjectDocs.map((s) => [s._id.toString(), s.title]));

    const resolveSubject = (id) => (id ? subjectMap[id.toString()] || id.toString() : 'N/A');

    // Build tutor blocks (max 4) – plain text
    const tutorDetailsText = tutors
      .slice(0, 4)
      .map(
        (tutor, index) => `
Tutor ${index + 1} Details
Subject: ${resolveSubject(tutor.subject)}
Class Duration: ${tutor.duration}
Frequency: ${tutor.frequency}
Preferred Tutor Type: ${tutor.preferredTutorType}
`
      )
      .join('\n');

    const text = `
Dear ${name},

Thank you for submitting your tutor request with Tuition Lanka.
We're happy to inform you that we have successfully received your request.

👤 Student Details
Full Name: ${name}
Email: ${email}
Phone Number: ${phoneNumber}
District: ${district}
City: ${city}

Academic Preferences
Medium: ${medium}
Grade: ${gradeName}
Number of Tutors Requested: ${tutors.length}

${tutorDetailsText}

Our team has now started processing your request. We will carefully review your requirements and contact you soon.

Warm regards,
Tuition Lanka Team
Tuition Lanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${name},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Thank you for submitting your tutor request with <strong>Tuition Lanka</strong>.
        We're happy to inform you that we have <strong>successfully received your request</strong>.
      </p>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Student Details</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Full Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone Number:</strong> ${phoneNumber}</li>
        <li><strong>District:</strong> ${district}</li>
        <li><strong>City:</strong> ${city}</li>
      </ul>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Academic Preferences</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Medium:</strong> ${medium}</li>
        <li><strong>Grade:</strong> ${gradeName}</li>
        <li><strong>Number of Tutors Requested:</strong> ${tutors.length}</li>
      </ul>

      ${tutors
        .slice(0, 4)
        .map(
          (tutor, index) => `
        <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Tutor ${index + 1} Details</p>
        <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
          <li><strong>Subject:</strong> ${resolveSubject(tutor.subject)}</li>
          <li><strong>Class Duration:</strong> ${tutor.duration}</li>
          <li><strong>Frequency:</strong> ${tutor.frequency}</li>
          <li><strong>Preferred Tutor Type:</strong> ${tutor.preferredTutorType}</li>
        </ul>
      `
        )
        .join('')}

      <p style="color:#374151;font-size:15px;line-height:1.7;margin:20px 0 0;">
        Our team has now started processing your request. We will carefully review your requirements,
        assign suitable tutors, and contact you shortly.
      </p>
    `);

    await transport.sendMail({
      from: config.email.from,
      to: email,
      subject: emailSubject,
      text,
      html,
    });
  } catch (err) {
    logger.error('Failed to send acknowledgement email:', err);
    throw new Error('Acknowledgement email failed');
  }
};

/**
 * Send tutor request rejection email
 * @param {string} to - Requester's email address
 * @param {string} requesterName - Requester's name
 * @param {string} rejectionReason - Admin rejection reason
 * @param {Object} requestTutorBody - Original request payload
 * @returns {Promise}
 */
const sendRequestTutorRejectedEmail = async (to, requesterName, rejectionReason, requestTutorBody) => {
  try {
    const subject = 'Update on Your Tutor Request - TuitionLanka';

    const safeName = escapeHtml(requesterName || 'there');
    const safeReason = escapeHtml(rejectionReason || 'No reason provided');
    const safeEmail = escapeHtml((requestTutorBody && requestTutorBody.email) || to || 'N/A');
    const gradeName = await resolveGradeName(requestTutorBody && requestTutorBody.grade);

    const safeCity = escapeHtml((requestTutorBody && requestTutorBody.city) || 'N/A');

    const safeDistrict = escapeHtml((requestTutorBody && requestTutorBody.district) || 'N/A');

    const safeGrade = escapeHtml(gradeName);

    const text = `
Dear ${requesterName || 'there'},

Thank you for submitting your tutor request to TuitionLanka.

We reviewed your tutor request and unfortunately we were unable to find a suitable match at this time.

Reason:
${rejectionReason || 'No reason provided'}

Request Details:
Name: ${requesterName || 'N/A'}
Email: ${(requestTutorBody && requestTutorBody.email) || to || 'N/A'}
City: ${(requestTutorBody && requestTutorBody.city) || 'N/A'}
District: ${(requestTutorBody && requestTutorBody.district) || 'N/A'}
Grade: ${gradeName}

You are welcome to submit a new tutor request in the future with updated details if needed.

Best regards,
TuitionLanka Team
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${safeName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Thank you for submitting your tutor request to <strong>Tuition Lanka</strong>.
        We reviewed your request and unfortunately we were unable to find a suitable match at this time.
      </p>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;padding:16px 20px;margin:20px 0;">
        <p style="margin:0 0 6px;font-weight:bold;color:#7f1d1d;">Reason provided by our team:</p>
        <p style="margin:0;color:#991b1b;white-space:pre-wrap;font-size:14px;">${safeReason}</p>
      </div>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Request Details</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Name:</strong> ${safeName}</li>
        <li><strong>Email:</strong> ${safeEmail}</li>
        <li><strong>City:</strong> ${safeCity}</li>
        <li><strong>District:</strong> ${safeDistrict}</li>
        <li><strong>Grade:</strong> ${safeGrade}</li>
      </ul>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        You are welcome to submit a new tutor request in the future with updated details if needed.
      </p>
    `);

    await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send tutor request rejected email to ${to}:`, err);

    throw new Error('Tutor request rejected email failed');
  }
};
/**
 * Send admin invitation email
 * @param {string} to
 * @param {string} name
 * @param {string} password
 * @returns {Promise}
 */
const sendAdminInviteEmail = async (to, name, token) => {
  try {
    const adminWebsiteUrl = process.env.ADMIN_WEBSITE_URL || 'http://localhost:3000';
    const resetUrl = `${adminWebsiteUrl}/reset-password?token=${token}`;
    const subject = 'Set Up Your Admin Account';

    const text = `
Hello ${name},

You have been added as an admin on TuitionLanka.

Please set your password using this link:
${resetUrl}

This link can be used only once and will expire soon.

Regards,
TuitionLanka Team
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Hello ${name},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        You have been added as an <strong>admin</strong> on <strong>Tuition Lanka</strong>.
        Please set your password by clicking the button below.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}"
           style="background-color:#235ED5;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
          Set Password
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.6;">
        If the button does not work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:#235ED5;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="color:#6b7280;font-size:13px;margin-top:12px;">This link can be used only once and will expire soon.</p>
    `);

    await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send admin invite email to ${to}:`, err);
    throw new Error('Admin invite email failed');
  }
};

/**
 * Send tutor registration pending email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @returns {Promise}
 */
const sendTutorRegistrationPendingEmail = async (to, tutorName) => {
  try {
    const subject = 'Your Tutor Registration is Pending Review – TuitionLanka';

    const text = `
Dear ${tutorName},

Thank you for registering as a tutor on TuitionLanka!

We have successfully received your registration and it is currently under review by our team.

What happens next?
- Our team will carefully review your profile and submitted documents.
- You will receive a confirmation email once your registration has been approved.
- This process typically takes 2–5 business days.

If you have any questions in the meantime, please don't hesitate to contact our support team.

Thank you for your patience and for choosing TuitionLanka.

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${tutorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Thank you for registering as a tutor on <strong>Tuition Lanka</strong>!
        We have successfully received your registration and it is currently <strong>under review</strong> by our team.
      </p>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">What happens next?</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li>Our team will carefully review your profile and submitted documents.</li>
        <li>You will receive a confirmation email once your registration has been <strong>approved</strong>.</li>
        <li>This process typically takes <strong>2–5 business days</strong>.</li>
      </ul>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        If you have any questions in the meantime, please don't hesitate to contact our support team.
        Thank you for your patience and for choosing Tuition Lanka.
      </p>
    `);

    await transport.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error(`Failed to send tutor registration pending email to ${to}:`, err);
    throw new Error('Tutor registration pending email failed');
  }
};

/**
 * Send tutor approval email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @returns {Promise}
 */
const sendTutorApprovedEmail = async (to, tutorName) => {
  try {
    const subject = 'Your Tutor Registration is Approved – TuitionLanka';
    const signInUrl = `${config.app.userUrl}?login=true`;
    let tutorRequestsTelegramGroupUrl = '';

    try {
      const inviteLink = await telegramService.createTutorInviteLink(tutorName);
      tutorRequestsTelegramGroupUrl = inviteLink && inviteLink.invite_link ? inviteLink.invite_link : '';
    } catch (telegramErr) {
      logger.warn(`Failed to generate Telegram tutor invite link for ${to}: ${telegramErr.message}`);
    }

    const { adminWhatsAppNumber } = config.email;
    const telegramSupportText = adminWhatsAppNumber
      ? `If you have any issues joining the Telegram group, please contact the TuitionLanka admin on WhatsApp: ${adminWhatsAppNumber}`
      : 'If you have any issues joining the Telegram group, please contact the TuitionLanka admin.';
    const telegramSupportHtml = adminWhatsAppNumber
      ? `If you have any issues joining the Telegram group, please contact the TuitionLanka admin on WhatsApp: <strong>${adminWhatsAppNumber}</strong>`
      : 'If you have any issues joining the Telegram group, please contact the TuitionLanka admin.';

    const telegramText = tutorRequestsTelegramGroupUrl
      ? `To receive new tuition requests, please join our official Telegram group using your secure one-time invite link.

This link can only be used once and will expire in 48 hours.
${tutorRequestsTelegramGroupUrl}

${telegramSupportText}`
      : `We could not generate your secure Telegram invite link automatically. ${telegramSupportText}`;

    const telegramHtml = tutorRequestsTelegramGroupUrl
      ? `
          <p>To receive new tuition requests, please join our official Telegram group using your secure one-time invite link.</p>
          <p>This link can only be used once and will expire in 48 hours.</p>
          <p style="text-align: center; margin: 24px 0;">
            <a href="${tutorRequestsTelegramGroupUrl}"
               style="background-color: #229ED9; color: #fff; padding: 13px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Join Telegram Group
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Or copy and paste this secure Telegram invite link into your browser:<br/>
            <a href="${tutorRequestsTelegramGroupUrl}" style="color: #4F46E5; font-weight: bold;">${tutorRequestsTelegramGroupUrl}</a>
          </p>
          <p>${telegramSupportHtml}</p>
        `
      : `
          <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 14px 18px; border-radius: 4px; margin: 22px 0;">
            <p style="margin: 0; color: #9a3412;">
              We could not generate your secure Telegram invite link automatically. ${telegramSupportHtml}
            </p>
          </div>
        `;

    const text = `
Dear ${tutorName},

Great news! Your tutor registration on TuitionLanka has been approved.

You can now log in to the platform using the link below:
${signInUrl}

${telegramText}

Thank you for joining TuitionLanka. We look forward to connecting you with students!

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${tutorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Great news! Your tutor registration on <strong>Tuition Lanka</strong> has been <strong style="color:#16a34a;">approved</strong>.
        You can now log in to the platform and start connecting with students.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${signInUrl}"
           style="background-color:#235ED5;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
          Log In to Tuition Lanka
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">
        Or copy this link into your browser:<br/>
        <a href="${signInUrl}" style="color:#235ED5;word-break:break-all;">${signInUrl}</a>
      </p>
      ${telegramHtml}
      <p style="color:#374151;font-size:15px;line-height:1.7;margin-top:16px;">
        Thank you for joining Tuition Lanka. We look forward to connecting you with students!
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to, subject, text, html });
  } catch (err) {
    logger.error(`Failed to send tutor approved email to ${to}:`, err);
    throw new Error('Tutor approved email failed');
  }
};

/**
 * Send tutor rejection email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @param {string} customMessage - Admin's custom rejection message
 * @returns {Promise}
 */
const sendTutorRejectedEmail = async (to, tutorName, customMessage) => {
  try {
    const subject = 'Your Tutor Registration has been Rejected – TuitionLanka';
    const messageBlock = customMessage ? `\nReason provided by our team:\n${customMessage}\n` : '';

    const text = `
Dear ${tutorName},

Thank you for your interest in joining TuitionLanka as a tutor.

After careful review, we regret to inform you that your registration has been rejected at this time.
${messageBlock}
If you have any questions or would like to discuss further, please contact our support team.

Thank you for your understanding.

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const messageHtml = customMessage
      ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
           <p style="margin: 0; color: #7f1d1d; font-size: 14px;"><strong>Reason provided by our team:</strong></p>
           <p style="margin: 8px 0 0; color: #991b1b; white-space: pre-wrap;">${customMessage}</p>
         </div>`
      : '';

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${tutorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Thank you for your interest in joining <strong>Tuition Lanka</strong> as a tutor.
        After careful review, we regret to inform you that your registration has been <strong style="color:#dc2626;">Rejected</strong> at this time.
      </p>
      ${messageHtml}
      <p style="color:#374151;font-size:15px;line-height:1.7;margin-top:16px;">
        If you have any questions or would like to discuss further, please contact our support team.
        Thank you for your understanding.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to, subject, text, html });
  } catch (err) {
    logger.error(`Failed to send tutor rejected email to ${to}:`, err);
    throw new Error('Tutor rejected email failed');
  }
};

/**
 * Send tutor suspension email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @returns {Promise}
 */
const sendTutorSuspendedEmail = async (to, tutorName) => {
  try {
    const subject = 'Your Tutor Account has been Suspended – TuitionLanka';

    const text = `
Dear ${tutorName},

We are writing to inform you that your TuitionLanka tutor account has been suspended.

During the suspension period, you will not be able to log in or access the platform.

If you believe this is a mistake or would like to appeal, please contact our support team directly.

Thank you for your understanding.

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${tutorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We are writing to inform you that your <strong>Tuition Lanka</strong> tutor account has been <strong>suspended</strong>.
      </p>
      <div style="background:#f3f4f6;border-left:4px solid #6b7280;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#374151;font-size:14px;">During the suspension period, you will not be able to log in or access the platform.</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.7;">
        If you believe this is a mistake or would like to appeal, please contact our support team directly.
        Thank you for your understanding.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to, subject, text, html });
  } catch (err) {
    logger.error(`Failed to send tutor suspended email to ${to}:`, err);
    throw new Error('Tutor suspended email failed');
  }
};

/**
 * Send email to requester when a tutor is assigned (TM-696)
 * @param {Object} tutorRequest - the full tutor request document
 * @param {Object} assignedBlock - the specific tutor block that was assigned
 * @param {string} subjectName - resolved subject name
 * @param {string} gradeName - resolved grade name
 * @param {Object} tutorDoc - the assigned tutor document
 */
const sendTutorAssignedToRequester = async (tutorRequest, assignedBlock, subjectName, gradeName, tutorDoc) => {
  try {
    const { name, email } = tutorRequest;

    const subject = 'Your Tutor Has Been Assigned – Tuition Lanka';

    const tutorName = tutorDoc ? tutorDoc.fullName : 'N/A';
    const tutorContact = tutorDoc ? tutorDoc.contactNumber : 'N/A';
    const tutorEmail = tutorDoc ? tutorDoc.email : 'N/A';
    const tutorTypes = tutorDoc && tutorDoc.tutorType ? tutorDoc.tutorType.join(', ') : 'N/A';
    const tutorEducation = tutorDoc ? tutorDoc.highestEducation : 'N/A';
    const tutorExperience = tutorDoc ? `${tutorDoc.yearsExperience} years` : 'N/A';
    const tutorIntro = tutorDoc ? tutorDoc.teachingSummary : '';
    const tutorAcademic = tutorDoc ? tutorDoc.academicDetails : '';
    const tutorResults = tutorDoc ? tutorDoc.studentResults : '';

    const text = `
Dear ${name},

Great news! A tutor has been assigned for your tuition request with Tuition Lanka.

Assignment Details
Grade: ${gradeName || 'N/A'}
Subject: ${subjectName}
Duration: ${assignedBlock.duration}
Frequency: ${assignedBlock.frequency}
Class Type: ${assignedBlock.preferredClassType}

Your Assigned Tutor
Name: ${tutorName}
Contact: ${tutorContact}
Email: ${tutorEmail}
Tutor Type: ${tutorTypes}
Highest Education: ${tutorEducation}
Years of Experience: ${tutorExperience}
${tutorIntro ? `\nIntroduction:\n${tutorIntro}` : ''}${
      tutorAcademic ? `\nTeaching Experience & Achievements:\n${tutorAcademic}` : ''
    }${tutorResults ? `\nStudent Results / Track Record:\n${tutorResults}` : ''}

Your assigned tutor will be in contact with you shortly to arrange the first session.

If you have any questions, feel free to reach out to us.

Warm regards,
Tuition Lanka Team
Tuition Lanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${name},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Great news! A tutor has been assigned for your tuition request with <strong>Tuition Lanka</strong>.
      </p>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Assignment Details</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Grade:</strong> ${gradeName || 'N/A'}</li>
        <li><strong>Subject:</strong> ${subjectName}</li>
        <li><strong>Duration:</strong> ${assignedBlock.duration}</li>
        <li><strong>Frequency:</strong> ${assignedBlock.frequency}</li>
        <li><strong>Class Type:</strong> ${assignedBlock.preferredClassType}</li>
      </ul>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Your Assigned Tutor</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Name:</strong> ${tutorName}</li>
        <li><strong>Contact:</strong> ${tutorContact}</li>
        <li><strong>Email:</strong> ${tutorEmail}</li>
        <li><strong>Tutor Type:</strong> ${tutorTypes}</li>
        <li><strong>Highest Education:</strong> ${tutorEducation}</li>
        <li><strong>Years of Experience:</strong> ${tutorExperience}</li>
      </ul>

      ${
        tutorIntro || tutorAcademic || tutorResults
          ? `
        <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Teaching Profile</p>
        ${
          tutorIntro
            ? `<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 10px;"><strong>Introduction:</strong><br/>${tutorIntro}</p>`
            : ''
        }
        ${
          tutorAcademic
            ? `<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 10px;"><strong>Teaching Experience &amp; Achievements:</strong><br/>${tutorAcademic}</p>`
            : ''
        }
        ${
          tutorResults
            ? `<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 10px;"><strong>Student Results / Track Record:</strong><br/>${tutorResults}</p>`
            : ''
        }
      `
          : ''
      }

      <p style="color:#374151;font-size:15px;line-height:1.7;margin-top:16px;">
        Your assigned tutor will be in contact with you shortly to arrange the first session.
        If you have any questions, feel free to reach out to us.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to: email, subject, text, html });
    logger.info(`TM-696: Tutor assigned email sent to requester: ${email}`);
  } catch (err) {
    logger.error('Failed to send tutor assigned email to requester:', err);
  }
};

/**
 * Send email to assigned tutor after assignment (TM-698)
 * @param {Object} tutorUser - the tutor's User document (has name, email)
 * @param {Object} tutorRequest - the full tutor request document
 * @param {Object} assignedBlock - the specific tutor block that was assigned
 * @param {string} subjectName - resolved subject name
 * @param {string} gradeName - resolved grade name
 */
const sendTutorAssignedToTutor = async (tutorUser, tutorRequest, assignedBlock, subjectName, gradeName) => {
  try {
    const { name: tutorName, email: tutorEmail } = tutorUser;
    const { name: studentName, email: studentEmail, phoneNumber, city, district, medium } = tutorRequest;

    const subject = 'New Tuition Assignment – Tuition Lanka';

    const text = `
Dear ${tutorName},

Congratulations! You have been assigned a new student through Tuition Lanka.

Student Details
Name: ${studentName}
Email: ${studentEmail}
Phone Number: ${phoneNumber}
City: ${city}
District: ${district}

Assignment Details
Grade: ${gradeName}
Subject: ${subjectName}
Medium: ${medium}
Duration: ${assignedBlock.duration}
Frequency: ${assignedBlock.frequency}
Class Type: ${assignedBlock.preferredClassType}
Preferred Tutor Type: ${assignedBlock.preferredTutorType}

Next Steps
Please reach out to the student directly using the contact details above to arrange the first session at a mutually convenient time.

If you have any questions or need assistance, feel free to contact us.

Warm regards,
Tuition Lanka Team
Tuition Lanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${tutorName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Congratulations! You have been assigned a new student through <strong>Tuition Lanka</strong>.
      </p>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Student Details</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Name:</strong> ${studentName}</li>
        <li><strong>Email:</strong> ${studentEmail}</li>
        <li><strong>Phone Number:</strong> ${phoneNumber}</li>
        <li><strong>City:</strong> ${city}</li>
        <li><strong>District:</strong> ${district}</li>
      </ul>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Assignment Details</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
        <li><strong>Grade:</strong> ${gradeName}</li>
        <li><strong>Subject:</strong> ${subjectName}</li>
        <li><strong>Medium:</strong> ${medium}</li>
        <li><strong>Duration:</strong> ${assignedBlock.duration}</li>
        <li><strong>Frequency:</strong> ${assignedBlock.frequency}</li>
        <li><strong>Class Type:</strong> ${assignedBlock.preferredClassType}</li>
        <li><strong>Preferred Tutor Type:</strong> ${assignedBlock.preferredTutorType}</li>
      </ul>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Next Steps</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Please reach out to the student directly using the contact details above to arrange
        the first session at a mutually convenient time.
        If you have any questions or need assistance, feel free to contact us.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to: tutorEmail, subject, text, html });
    logger.info(`TM-698: Assignment email sent to tutor: ${tutorEmail}`);
  } catch (err) {
    logger.error('Failed to send assignment email to tutor:', err);
  }
};

/**
 * Send tutor unassignment notification email to the requester
 * @param {Object} tutorRequest
 * @param {Array}  unassignedBlocks  - [{ subjectName, tutorName }]
 * @param {string} unassignReason
 */
const sendTutorUnassignedToRequester = async (tutorRequest, unassignedBlocks, unassignReason) => {
  try {
    const { name, email } = tutorRequest;
    const subject = 'Update on Your Tuition Request – Tuition Lanka';

    const blockLines = unassignedBlocks
      .map((b) => `  - ${b.subjectName} (previously assigned to ${b.tutorName})`)
      .join('\n');

    const blockHtml = unassignedBlocks
      .map(
        (b) => `<li><strong>${escapeHtml(b.subjectName)}</strong> — previously assigned to ${escapeHtml(b.tutorName)}</li>`
      )
      .join('');

    const text = `
Dear ${name},

We wanted to let you know that the tutor previously assigned to your tuition request has been unassigned.

Affected Subject(s):
${blockLines}

Reason: ${unassignReason}

Our team is already working on finding a suitable replacement and will be in touch with you shortly.

If you have any questions, please don't hesitate to contact us.

Warm regards,
Tuition Lanka Team
Tuition Lanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${escapeHtml(
        name
      )},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We wanted to let you know that the tutor previously assigned to your tuition request has been <strong>unassigned</strong>.
      </p>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Affected Subject(s)</p>
      <ul style="color:#374151;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 16px;">${blockHtml}</ul>

      <p style="font-weight:bold;color:#235ED5;margin:20px 0 8px;">Reason</p>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">${escapeHtml(unassignReason)}</p>

      <p style="color:#374151;font-size:15px;line-height:1.7;">
        Our team is already working on finding a suitable replacement and will be in touch with you shortly.
        If you have any questions, please don't hesitate to contact us.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to: email, subject, text, html });
    logger.info(`Tutor unassigned email sent to requester: ${email}`);
  } catch (err) {
    logger.error('Failed to send tutor unassigned email to requester:', err);
  }
};

/**
 * Send admin account rejection email
 * @param {string} to - Admin's email address
 * @param {string} adminName - Admin's name
 * @param {string} customMessage - Optional rejection reason
 * @returns {Promise}
 */
const sendAdminRejectedEmail = async (to, adminName, customMessage) => {
  try {
    const subject = 'Your Admin Account has been Rejected – TuitionLanka';
    const messageBlock = customMessage ? `\nReason provided by our team:\n${customMessage}\n` : '';

    const text = `
Dear ${adminName},

We regret to inform you that your TuitionLanka admin account has been rejected.
${messageBlock}
If you believe this is a mistake or would like to discuss further, please contact our support team.

Thank you for your understanding.

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const messageHtml = customMessage
      ? `<div style="background-color:#fef2f2;border-left:4px solid #ef4444;padding:14px 18px;border-radius:4px;margin:20px 0;">
           <p style="margin:0;color:#7f1d1d;font-size:14px;"><strong>Reason provided by our team:</strong></p>
           <p style="margin:8px 0 0;color:#991b1b;white-space:pre-wrap;">${customMessage}</p>
         </div>`
      : '';

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${adminName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We regret to inform you that your <strong>Tuition Lanka</strong> admin account has been <strong style="color:#dc2626;">Rejected</strong>.
      </p>
      ${messageHtml}
      <p style="color:#374151;font-size:15px;line-height:1.7;margin-top:16px;">
        If you believe this is a mistake or would like to discuss further, please contact our support team.
        Thank you for your understanding.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to, subject, text, html });
  } catch (err) {
    logger.error(`Failed to send admin rejected email to ${to}:`, err);
    throw new Error('Admin rejected email failed');
  }
};

/**
 * Send admin account suspension email
 * @param {string} to - Admin's email address
 * @param {string} adminName - Admin's name
 * @returns {Promise}
 */
const sendAdminSuspendedEmail = async (to, adminName) => {
  try {
    const subject = 'Your Admin Account has been Suspended – TuitionLanka';

    const text = `
Dear ${adminName},

We are writing to inform you that your TuitionLanka admin account has been suspended.

During the suspension period, you will not be able to log in or access the platform.

If you believe this is a mistake or would like to appeal, please contact our support team directly.

Thank you for your understanding.

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const html = buildEmailHtml(`
      <p style="color:#235ED5;font-size:18px;font-weight:bold;text-align:center;margin:0 0 20px;">Dear ${adminName},</p>
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
        We are writing to inform you that your <strong>Tuition Lanka</strong> admin account has been <strong>suspended</strong>.
      </p>
      <div style="background:#f3f4f6;border-left:4px solid #6b7280;border-radius:4px;padding:14px 18px;margin:20px 0;">
        <p style="margin:0;color:#374151;font-size:14px;">During the suspension period, you will not be able to log in or access the platform.</p>
      </div>
      <p style="color:#374151;font-size:15px;line-height:1.7;">
        If you believe this is a mistake or would like to appeal, please contact our support team directly.
        Thank you for your understanding.
      </p>
    `);

    await transport.sendMail({ from: config.email.from, to, subject, text, html });
  } catch (err) {
    logger.error(`Failed to send admin suspended email to ${to}:`, err);
    throw new Error('Admin suspended email failed');
  }
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendTemporaryPasswordEmail,
  sendAcknowledgement,
  sendRequestTutorRejectedEmail,
  sendTutorAssignedToRequester,
  sendTutorAssignedToTutor,
  sendTutorUnassignedToRequester,
  sendTutorRegistrationPendingEmail,
  sendTutorApprovedEmail,
  sendTutorRejectedEmail,
  sendTutorSuspendedEmail,
  sendAdminInviteEmail,
  sendAdminRejectedEmail,
  sendAdminSuspendedEmail,
};
