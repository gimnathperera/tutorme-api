const httpStatus = require('http-status');
const { Referee, Tutor, User, ReferralReward } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const emailService = require('./email.service');
const referralCodeService = require('./referralCode.service');

/**
 * Check whether an email can be used for a new referee.
 * @param {string} email
 * @returns {Promise<{available: boolean, message: string}>}
 */
const getEmailAvailability = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const [existingReferee, existingUser, existingTutor] = await Promise.all([
    Referee.findOne({ email: normalizedEmail }).select('_id').lean(),
    User.findOne({ email: normalizedEmail }).select('_id').lean(),
    Tutor.findOne({ email: normalizedEmail }).select('_id').lean(),
  ]);

  if (existingReferee || existingUser || existingTutor) {
    return { available: false, message: 'Email already exists' };
  }

  return { available: true, message: 'Email is available' };
};

/**
 * Create a referee, auto-assign a referral code, and email it to them.
 */
const createReferee = async ({ name, email, contactNumber, gender, avatar, accountName, accountNumber, bankName }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const availability = await getEmailAvailability(normalizedEmail);
  if (!availability.available) {
    throw new ApiError(httpStatus.BAD_REQUEST, availability.message);
  }

  const referralCode = await referralCodeService.generateUniqueReferralCode();

  const referee = await Referee.create({
    name,
    email: normalizedEmail,
    contactNumber,
    gender,
    avatar: avatar || undefined,
    referralCode,
    accountName: accountName || undefined,
    accountNumber: accountNumber || undefined,
    bankName: bankName || undefined,
  });

  try {
    await emailService.sendReferralCodeEmail(referee.email, referee.name, referee.referralCode);
  } catch (emailErr) {
    logger.warn(`Referee created but failed to send referral code email to ${referee.email}: ${emailErr.message}`);
  }

  return referee;
};

/**
 * Get a paginated list of referees with their referral counts attached.
 * Counts are derived from ReferralReward records (created once at the referred
 * tutor's registration and kept for the referral's lifetime) rather than from
 * live Tutor.referredByCode matches. Tutor.deleteTutorById only removes the
 * ReferralReward entry for still-pending referrals, so an approved/rewarded
 * referral's count survives the referred tutor being deleted later.
 */
const queryReferees = async (filter, options) => {
  const { search } = filter;
  const mongoFilter = {};

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    mongoFilter.$or = [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }

  const referees = await Referee.paginate(mongoFilter, options);

  const refereeIds = referees.results.map((r) => r._id);
  const counts =
    refereeIds.length > 0
      ? await ReferralReward.aggregate([
          { $match: { referrerModel: 'Referee', referrerTutorId: { $in: refereeIds } } },
          { $group: { _id: '$referrerTutorId', count: { $sum: 1 } } },
        ])
      : [];
  const countById = new Map(counts.map((c) => [c._id.toString(), c.count]));

  referees.results = referees.results.map((referee) => {
    const serialized = typeof referee.toJSON === 'function' ? referee.toJSON() : referee;
    serialized.referralCount = countById.get(referee._id.toString()) || 0;
    return serialized;
  });

  return referees;
};

/**
 * Update a referee's details. The referral code can never be changed here.
 */
const updateReferee = async (id, updateBody) => {
  const referee = await Referee.findById(id);
  if (!referee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Referee not found');
  }

  const { referralCode, ...safeUpdateBody } = updateBody;

  if (safeUpdateBody.email) {
    const normalizedEmail = safeUpdateBody.email.toLowerCase().trim();

    if (normalizedEmail !== referee.email) {
      const [existingReferee, existingUser, existingTutor] = await Promise.all([
        Referee.findOne({ email: normalizedEmail, _id: { $ne: id } })
          .select('_id')
          .lean(),
        User.findOne({ email: normalizedEmail }).select('_id').lean(),
        Tutor.findOne({ email: normalizedEmail }).select('_id').lean(),
      ]);

      if (existingReferee || existingUser || existingTutor) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
      }
    }

    safeUpdateBody.email = normalizedEmail;
  }

  Object.assign(referee, safeUpdateBody);
  await referee.save();

  return referee;
};

/**
 * Delete a referee.
 */
const deleteReferee = async (id) => {
  const referee = await Referee.findById(id);
  if (!referee) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Referee not found');
  }

  await referee.deleteOne();

  return referee;
};

module.exports = {
  getEmailAvailability,
  createReferee,
  queryReferees,
  updateReferee,
  deleteReferee,
};
