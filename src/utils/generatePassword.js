const crypto = require('crypto');

/**
 * Generate a temporary password
 * @param {number} length - Length of the password (default: 12)
 * @returns {string} Generated temporary password
 */
const generateTempPassword = (length = 12) => {
  if (length < 2) {
    throw new Error('Password length must be at least 2');
  }

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const all = letters + numbers;

  let password = '';
  password += letters[crypto.randomInt(0, letters.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];

  for (let i = 2; i < length; i += 1) {
    password += all[crypto.randomInt(0, all.length)];
  }

  password = password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');

  return password;
};

module.exports = {
  generateTempPassword,
};
