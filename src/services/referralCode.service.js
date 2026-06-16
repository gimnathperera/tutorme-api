const crypto = require('crypto');
const { Tutor, User, Referee } = require('../models');

const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const generateReferralCode = () => {
  const bytes = crypto.randomBytes(8);
  return Array.from(bytes)
    .map((b) => REFERRAL_CODE_CHARS[b % 36])
    .join('');
};

/**
 * Generate a referral code that isn't already used by a tutor, an admin user, or a referee.
 * @returns {Promise<string>}
 */
const generateUniqueReferralCode = async () => {
  let code;
  let taken = true;
  while (taken) {
    code = generateReferralCode();
    // eslint-disable-next-line no-await-in-loop
    const [tutorExists, userExists, refereeExists] = await Promise.all([
      Tutor.findOne({ referralCode: code }).select('_id').lean(),
      User.findOne({ referralCode: code }).select('_id').lean(),
      Referee.findOne({ referralCode: code }).select('_id').lean(),
    ]);
    taken = Boolean(tutorExists || userExists || refereeExists);
  }
  return code;
};

/**
 * Find whichever Tutor, admin User, or Referee document owns a given referral code.
 * @param {string} code
 * @returns {Promise<{ type: 'Tutor'|'User'|'Referee', id: string, name: string, email: string } | null>}
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

  const referee = await Referee.findOne({ referralCode: normalized }).select('_id name email').lean();
  if (referee) {
    return { type: 'Referee', id: referee._id.toString(), name: referee.name, email: referee.email };
  }

  return null;
};

module.exports = {
  generateReferralCode,
  generateUniqueReferralCode,
  findReferrerByReferralCode,
};
