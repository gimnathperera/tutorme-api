const crypto = require('crypto');
const { Tutor, User } = require('../models');

const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateReferralCode = () => {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => REFERRAL_CODE_CHARS[b % 36])
    .join('');
};

/**
 * Generate a referral code that isn't already used by a tutor or an admin user.
 * @returns {Promise<string>}
 */
const generateUniqueReferralCode = async () => {
  let code;
  let taken = true;
  while (taken) {
    code = generateReferralCode();
    // eslint-disable-next-line no-await-in-loop
    const [tutorExists, userExists] = await Promise.all([
      Tutor.findOne({ referralCode: code }).select('_id').lean(),
      User.findOne({ referralCode: code }).select('_id').lean(),
    ]);
    taken = Boolean(tutorExists || userExists);
  }
  return code;
};

/**
 * Find whichever Tutor or admin User document owns a given referral code.
 * @param {string} code
 * @returns {Promise<{ type: 'Tutor'|'User', id: string, name: string, email: string } | null>}
 */
const findReferrerByReferralCode = async (code) => {
  if (!code) return null;
  const normalized = code.toUpperCase().trim();

  const tutor = await Tutor.findOne({ referralCode: normalized }).select('_id fullName email').lean();
  if (tutor) {
    return { type: 'Tutor', id: tutor._id.toString(), name: tutor.fullName, email: tutor.email };
  }

  const user = await User.findOne({ referralCode: normalized, role: 'admin' }).select('_id name email').lean();
  if (user) {
    return { type: 'User', id: user._id.toString(), name: user.name, email: user.email };
  }

  return null;
};

module.exports = {
  generateReferralCode,
  generateUniqueReferralCode,
  findReferrerByReferralCode,
};
