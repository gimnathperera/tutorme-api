// utils/generatePassword.js
const crypto = require('crypto');

/**
 * Generate a temporary password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated temporary password
 */
const generateTempPassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i += 1) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Generate a secure random password using crypto.randomBytes
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated secure password
 */
const generateSecurePassword = (length = 12) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
};

/**
 * Generate a password with custom requirements
 * @param {Object} options - Password generation options
 * @param {number} options.length - Password length (default: 12)
 * @param {boolean} options.includeUppercase - Include uppercase letters (default: true)
 * @param {boolean} options.includeLowercase - Include lowercase letters (default: true)
 * @param {boolean} options.includeNumbers - Include numbers (default: true)
 * @param {boolean} options.includeSymbols - Include symbols (default: true)
 * @returns {string} Generated password
 */
const generateCustomPassword = (options = {}) => {
  const {
    length = 12,
    includeUppercase = true,
    includeLowercase = true,
    includeNumbers = true,
    includeSymbols = true,
  } = options;

  let charset = '';

  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*';

  if (charset === '') {
    throw new Error('At least one character type must be included');
  }

  let password = '';
  for (let i = 0; i < length; i += 1) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }

  return password;
};

module.exports = {
  generateTempPassword,
  generateSecurePassword,
  generateCustomPassword,
};
