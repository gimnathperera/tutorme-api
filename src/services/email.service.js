const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const { Grade, Subject } = require('../models');

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
const sendEmail = async (to, subject, text) => {
  const msg = { from: config.email.from, to, subject, text };
  await transport.sendMail(msg);
};

/**
 * Send reset password email (HTML + Text)
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  try {
    const subject = 'Reset Your TutorMe Password';
    const resetPasswordUrl = `https://tuitionlanka.com/reset-password?token=${token}`;

    const text = `
Hello,

We received a request to reset the password for your TutorMe account.

Reset your password using the link below:
${resetPasswordUrl}

If you didn’t request this, please ignore this email.
`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
        <p>Hello,</p>
        <p>We received a request to reset the password for your <strong>TutorMe</strong> account.</p>
        <p>You can reset your password by clicking the button below:</p>
        <p style="text-align: center; margin: 25px 0;">
          <a href="${resetPasswordUrl}" 
             style="background-color: #4F46E5; color: #fff; padding: 12px 24px; 
                    border-radius: 8px; text-decoration: none; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p>If the button above doesn’t work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #1d4ed8;">${resetPasswordUrl}</p>
        <p>If you did not request a password reset, please ignore this message.</p>
        <p>Thank you,<br><strong>The TutorMe Support Team</strong></p>
      </div>
    `;

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
    const subject = 'Your Temporary Password for TutorMe';
    const text = `
Dear ${username},

A temporary password has been generated for your account.

=====================================
Temporary Password: ${tempPassword}
=====================================

Security Notice:
- Please log in immediately and change your password to something secure.
- Do not share this password with anyone.

If you did not request this, please contact support.

Thanks, 
The TutorMe support team.`;

    await sendEmail(to, subject, text);
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

    const html = `
      <div style="font-family: Arial, sans-serif; color:#222; line-height:1.6">
        <p>Dear <strong>${name}</strong>,</p>

        <p>Thank you for submitting your tutor request with <strong>Tuition Lanka</strong>.
        We're happy to inform you that we have successfully received your request.</p>

        <h3>👤 Student Details</h3>
        <ul>
          <li><strong>Full Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber}</li>
          <li><strong>District:</strong> ${district}</li>
          <li><strong>City:</strong> ${city}</li>
        </ul>

        <h3>📘 Academic Preferences</h3>
        <ul>
          <li><strong>Medium:</strong> ${medium}</li>
          <li><strong>Grade:</strong> ${gradeName}</li>
          <li><strong>Number of Tutors Requested:</strong> ${tutors.length}</li>
        </ul>

        ${tutors
          .slice(0, 4)
          .map(
            (tutor, index) => `
          <h4>Tutor ${index + 1} Details</h4>
          <ul>
            <li><strong>Subject:</strong> ${resolveSubject(tutor.subject)}</li>
            <li><strong>Class Duration:</strong> ${tutor.duration}</li>
            <li><strong>Frequency:</strong> ${tutor.frequency}</li>
            <li><strong>Preferred Tutor Type:</strong> ${tutor.preferredTutorType}</li>
          </ul>
        `
          )
          .join('')}

        <p>
          Our team has now started processing your request. We will carefully review your requirements,
          assign suitable tutors, and contact you shortly.
        </p>

        <p>
          Warm regards,<br/>
          <strong>Tuition Lanka Team</strong><br/>
          Tuition Lanka – Learn Better, Achieve More
        </p>
      </div>
    `;

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
 * Send tutor registration pending email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @returns {Promise}
 */
const sendTutorRegistrationPendingEmail = async (to, tutorName) => {
  try {
    const subject = 'Your Tutor Registration is Pending Review – TutorMe';

    const text = `
Dear ${tutorName},

Thank you for registering as a tutor on TutorMe!

We have successfully received your registration and it is currently under review by our team.

What happens next?
- Our team will carefully review your profile and submitted documents.
- You will receive a confirmation email once your registration has been approved.
- This process typically takes 2–5 business days.

If you have any questions in the meantime, please don't hesitate to contact our support team.

Thank you for your patience and for choosing TutorMe.

Warm regards,
The TutorMe Team
TutorMe – Learn Better, Achieve More
`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Registration Received – Pending Review</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${tutorName}</strong>,</p>
          <p>Thank you for registering as a tutor on <strong>TutorMe</strong>!</p>
          <p>We have successfully received your registration and it is currently <strong>under review</strong> by our team.</p>

          <div style="background-color: #EFF6FF; border-left: 4px solid #4F46E5; padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📋 What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
              <li>Our team will carefully review your profile and submitted documents.</li>
              <li>You will receive a confirmation email once your registration has been <strong>approved</strong>.</li>
              <li>This process typically takes <strong>2–5 business days</strong>.</li>
            </ul>
          </div>

          <p>If you have any questions in the meantime, please don't hesitate to contact our support team.</p>
          <p>Thank you for your patience and for choosing TutorMe.</p>

          <p style="margin-top: 28px;">
            Warm regards,<br/>
            <strong>The TutorMe Team</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">TutorMe – Learn Better, Achieve More</span>
          </p>
        </div>
      </div>
    `;

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

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendTemporaryPasswordEmail,
  sendAcknowledgement,
  sendTutorRegistrationPendingEmail,
};
