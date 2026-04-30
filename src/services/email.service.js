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
    const subject = 'Reset Your TuitionLanka Password';
    const resetPasswordUrl = `https://tuitionlanka.com/reset-password?token=${token}`;

    const text = `
Hello,

We received a request to reset the password for your TuitionLanka account.

Reset your password using the link below:
${resetPasswordUrl}

If you didn’t request this, please ignore this email.
`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.6;">
        <p>Hello,</p>
        <p>We received a request to reset the password for your <strong>TuitionLanka</strong> account.</p>
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
        <p>Thank you,<br><strong>The TuitionLanka Support Team</strong></p>
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

You have been added as an admin on TutorMe.

Please set your password using this link:
${resetUrl}

This link can be used only once and will expire soon.

Regards,
TutorMe Team
`;

    const html = `
      <div style="font-family: Arial, sans-serif; color:#222; line-height:1.6">
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been added as an <strong>admin</strong> on <strong>TutorMe</strong>.</p>
        <p>Please set your password by clicking the button below:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#111827;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">
            Set Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;">${resetUrl}</p>
        <p>Regards,<br/>TutorMe Team</p>
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

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4F46E5; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Registration Received – Pending Review</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${tutorName}</strong>,</p>
          <p>Thank you for registering as a tutor on <strong>TuitionLanka</strong>!</p>
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
          <p>Thank you for your patience and for choosing TuitionLanka.</p>

          <p style="margin-top: 28px;">
            Warm regards,<br/>
            <strong>The TuitionLanka Team</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">TuitionLanka – Learn Better, Achieve More</span>
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

/**
 * Send tutor approval email
 * @param {string} to - Tutor's email address
 * @param {string} tutorName - Tutor's full name
 * @returns {Promise}
 */
const sendTutorApprovedEmail = async (to, tutorName) => {
  try {
    const subject = 'Your Tutor Registration is Approved – TuitionLanka';
    const signInUrl = 'https://www.tuitionlanka.com?login=true';

    const text = `
Dear ${tutorName},

Great news! Your tutor registration on TuitionLanka has been approved.

You can now log in to the platform using the link below:
${signInUrl}

Thank you for joining TuitionLanka. We look forward to connecting you with students!

Warm regards,
The TuitionLanka Team
TuitionLanka – Learn Better, Achieve More
`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">🎉 Registration Approved!</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${tutorName}</strong>,</p>
          <p>Great news! Your tutor registration on <strong>TuitionLanka</strong> has been <strong style="color: #16a34a;">approved</strong>.</p>
          <p>You can now log in to the platform and start connecting with students.</p>

          <p style="text-align: center; margin: 28px 0;">
            <a href="${signInUrl}"
               style="background-color: #4F46E5; color: #fff; padding: 13px 28px;
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              Log In to TuitionLanka
            </a>
          </p>

          <p style="color: #6b7280; font-size: 13px;">Or copy this link into your browser:<br/>
            <a href="${signInUrl}" style="color: #4F46E5;">${signInUrl}</a>
          </p>

          <p>Thank you for joining TuitionLanka. We look forward to connecting you with students!</p>

          <p style="margin-top: 28px;">
            Warm regards,<br/>
            <strong>The TuitionLanka Team</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">TuitionLanka – Learn Better, Achieve More</span>
          </p>
        </div>
      </div>
    `;

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
    const subject = 'Your Tutor Registration was Not Approved – TuitionLanka';
    const messageBlock = customMessage ? `\nReason provided by our team:\n${customMessage}\n` : '';

    const text = `
Dear ${tutorName},

Thank you for your interest in joining TuitionLanka as a tutor.

After careful review, we regret to inform you that your registration has not been approved at this time.
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

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc2626; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Registration Not Approved</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${tutorName}</strong>,</p>
          <p>Thank you for your interest in joining <strong>TuitionLanka</strong> as a tutor.</p>
          <p>After careful review, we regret to inform you that your registration has <strong style="color: #dc2626;">not been approved</strong> at this time.</p>

          ${messageHtml}

          <p>If you have any questions or would like to discuss further, please contact our support team.</p>
          <p>Thank you for your understanding.</p>

          <p style="margin-top: 28px;">
            Warm regards,<br/>
            <strong>The TuitionLanka Team</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">TuitionLanka – Learn Better, Achieve More</span>
          </p>
        </div>
      </div>
    `;

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

    const html = `
      <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.7; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4b5563; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0; font-size: 22px;">Account Suspended</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Dear <strong>${tutorName}</strong>,</p>
          <p>We are writing to inform you that your <strong>TuitionLanka</strong> tutor account has been <strong style="color: #4b5563;">suspended</strong>.</p>

          <div style="background-color: #f3f4f6; border-left: 4px solid #6b7280; padding: 14px 18px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #374151;">During the suspension period, you will not be able to log in or access the platform.</p>
          </div>

          <p>If you believe this is a mistake or would like to appeal, please contact our support team directly.</p>
          <p>Thank you for your understanding.</p>

          <p style="margin-top: 28px;">
            Warm regards,<br/>
            <strong>The TuitionLanka Team</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">TuitionLanka – Learn Better, Achieve More</span>
          </p>
        </div>
      </div>
    `;

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

    const html = `
      <div style="font-family: Arial, sans-serif; color:#222; line-height:1.6">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Great news! A tutor has been assigned for your tuition request with <strong>Tuition Lanka</strong>.</p>

        <h3>📋 Assignment Details</h3>
        <ul>
          <li><strong>Grade:</strong> ${gradeName || 'N/A'}</li>
          <li><strong>Subject:</strong> ${subjectName}</li>
          <li><strong>Duration:</strong> ${assignedBlock.duration}</li>
          <li><strong>Frequency:</strong> ${assignedBlock.frequency}</li>
          <li><strong>Class Type:</strong> ${assignedBlock.preferredClassType}</li>
        </ul>

        <h3>👤 Your Assigned Tutor</h3>
        <ul>
          <li><strong>Name:</strong> ${tutorName}</li>
          <li><strong>Contact:</strong> ${tutorContact}</li>
          <li><strong>Email:</strong> ${tutorEmail}</li>
          <li><strong>Tutor Type:</strong> ${tutorTypes}</li>
          <li><strong>Highest Education:</strong> ${tutorEducation}</li>
          <li><strong>Years of Experience:</strong> ${tutorExperience}</li>
        </ul>

        <h3>📝 Teaching Profile</h3>
        ${tutorIntro ? `<p><strong>Introduction:</strong><br/>${tutorIntro}</p>` : ''}
        ${tutorAcademic ? `<p><strong>Teaching Experience &amp; Achievements:</strong><br/>${tutorAcademic}</p>` : ''}
        ${tutorResults ? `<p><strong>Student Results / Track Record:</strong><br/>${tutorResults}</p>` : ''}

        <p>Your assigned tutor will be in contact with you shortly to arrange the first session.</p>
        <p>If you have any questions, feel free to reach out to us.</p>

        <p>Warm regards,<br/>
        <strong>Tuition Lanka Team</strong><br/>
        Tuition Lanka – Learn Better, Achieve More</p>
      </div>
    `;

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

    const html = `
      <div style="font-family: Arial, sans-serif; color:#222; line-height:1.6">
        <p>Dear <strong>${tutorName}</strong>,</p>
        <p>Congratulations! You have been assigned a new student through <strong>Tuition Lanka</strong>.</p>

        <h3>👤 Student Details</h3>
        <ul>
          <li><strong>Name:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Phone Number:</strong> ${phoneNumber}</li>
          <li><strong>City:</strong> ${city}</li>
          <li><strong>District:</strong> ${district}</li>
        </ul>

        <h3>📋 Assignment Details</h3>
        <ul>
          <li><strong>Grade:</strong> ${gradeName}</li>
          <li><strong>Subject:</strong> ${subjectName}</li>
          <li><strong>Medium:</strong> ${medium}</li>
          <li><strong>Duration:</strong> ${assignedBlock.duration}</li>
          <li><strong>Frequency:</strong> ${assignedBlock.frequency}</li>
          <li><strong>Class Type:</strong> ${assignedBlock.preferredClassType}</li>
          <li><strong>Preferred Tutor Type:</strong> ${assignedBlock.preferredTutorType}</li>
        </ul>

        <h3>✅ Next Steps</h3>
        <p>
          Please reach out to the student directly using the contact details above to arrange
          the first session at a mutually convenient time.
        </p>
        <p>If you have any questions or need assistance, feel free to contact us.</p>

        <p>Warm regards,<br/>
        <strong>Tuition Lanka Team</strong><br/>
        Tuition Lanka – Learn Better, Achieve More</p>
      </div>
    `;

    await transport.sendMail({ from: config.email.from, to: tutorEmail, subject, text, html });
    logger.info(`TM-698: Assignment email sent to tutor: ${tutorEmail}`);
  } catch (err) {
    logger.error('Failed to send assignment email to tutor:', err);
  }
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendTemporaryPasswordEmail,
  sendAcknowledgement,
  sendTutorAssignedToRequester,
  sendTutorAssignedToTutor,
  sendTutorRegistrationPendingEmail,
  sendTutorApprovedEmail,
  sendTutorRejectedEmail,
  sendTutorSuspendedEmail,
  sendAdminInviteEmail,
};
