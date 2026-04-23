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
};
