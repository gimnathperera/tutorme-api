const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

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
    const resetPasswordUrl = `https://tutorme-client.vercel.app/reset-password?token=${token}`;

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

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendTemporaryPasswordEmail,
};
