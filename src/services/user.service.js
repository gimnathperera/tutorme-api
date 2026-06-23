const httpStatus = require('http-status');
const { User, Tutor } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/generatePassword');
const tokenService = require('./token.service');
const { normalizeUserProfileFields } = require('../utils/availability');
const emailService = require('./email.service');
const accountSyncService = require('./accountSync.service');
const referralCodeService = require('./referralCode.service');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildUserSearchFilter = (filter = {}) => {
  const normalizedFilter = { ...filter };
  const searchTerm = typeof normalizedFilter.search === 'string' ? normalizedFilter.search.trim() : '';

  delete normalizedFilter.search;

  // `roles` (comma-separated) expands into a Mongoose $in query on the role field.
  // Backward-compatible: the existing `role` single-value filter still works as before.
  if (typeof normalizedFilter.roles === 'string' && normalizedFilter.roles.trim()) {
    const roleList = normalizedFilter.roles
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    if (roleList.length > 0) {
      normalizedFilter.role = { $in: roleList };
    }
    delete normalizedFilter.roles;
  }

  if (!searchTerm) {
    return normalizedFilter;
  }

  const searchRegex = {
    $regex: escapeRegex(searchTerm),
    $options: 'i',
  };

  return {
    ...normalizedFilter,
    $or: [{ name: searchRegex }, { email: searchRegex }],
  };
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  const normalizedUserBody = normalizeUserProfileFields(userBody);

  if (await User.isEmailTaken(normalizedUserBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This email is already in use. Please sign in or use a different email.');
  }
  return User.create(normalizedUserBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  const hasReferralCode = filter.hasReferralCode === 'true';

  // Strip non-DB fields before building the Mongoose filter
  const { hasReferralCode: _ignored, ...dbFilter } = filter;
  const mongoFilter = buildUserSearchFilter(dbFilter);

  if (hasReferralCode) {
    // Tutor referral codes are stored on the Tutor model, not the User model.
    // Admin referral codes are on the User model directly.
    // Pre-fetch which tutors have a code so we can filter at pagination time.
    const tutorsWithCode = await Tutor.find({ referralCode: { $exists: true, $ne: null } })
      .select('_id')
      .lean();
    const tutorIdsWithCode = tutorsWithCode.map((t) => t._id);

    const referralCodeOr = [
      // Admin/User rows: referralCode field is directly on the User document
      { role: { $ne: 'tutor' }, referralCode: { $exists: true, $ne: null } },
      // Tutor rows: referralCode is on the linked Tutor document
      { role: 'tutor', tutorId: { $in: tutorIdsWithCode } },
    ];

    if (mongoFilter.$or) {
      // An existing $or from the search term — combine both conditions with $and
      mongoFilter.$and = [{ $or: mongoFilter.$or }, { $or: referralCodeOr }];
      delete mongoFilter.$or;
    } else {
      mongoFilter.$or = referralCodeOr;
    }
  }

  const users = await User.paginate(mongoFilter, options);

  // Attach each linked tutor's referral code so the admin UI can show "code sent" state
  // for tutor rows without changing the existing tutorId (string) field shape.
  const tutorUserIds = users.results.filter((user) => user.role === 'tutor' && user.tutorId).map((user) => user.tutorId);

  if (tutorUserIds.length > 0) {
    const tutors = await Tutor.find({ _id: { $in: tutorUserIds } })
      .select('referralCode')
      .lean();
    const referralCodeByTutorId = new Map(tutors.map((tutor) => [tutor._id.toString(), tutor.referralCode]));

    users.results = users.results.map((user) => {
      const serialized = typeof user.toJSON === 'function' ? user.toJSON() : user;
      if (user.role === 'tutor' && user.tutorId) {
        serialized.referralCode = referralCodeByTutorId.get(user.tutorId.toString()) || undefined;
      }
      return serialized;
    });
  }

  return users;
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id).populate('grades').populate('subjects');
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const tutorProfileFields = [
  'nationality',
  'race',
  'classType',
  'tutoringLevels',
  'preferredLocations',
  'tutorType',
  'highestEducation',
  'yearsExperience',
  'tutorMediums',
  'grades',
  'subjects',
  'academicDetails',
  'teachingSummary',
  'studentResults',
  'sellingPoints',
  'certificatesAndQualifications',
  'availability',
  'rate',
  'language',
  'timeZone',
];

const hasTutorProfileFields = (payload) =>
  tutorProfileFields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @param {Object} [actor]
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody, actor) => {
  const normalizedUpdateBody = normalizeUserProfileFields(updateBody);
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (normalizedUpdateBody.email && (await User.isEmailTaken(normalizedUpdateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (user.tutorId && updateBody.role && updateBody.role !== 'tutor') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Linked tutor users must keep the tutor role');
  }

  if (actor && actor.role !== 'admin' && actor.id !== user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  if (hasTutorProfileFields(normalizedUpdateBody) && user.role !== 'tutor') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Tutor profile fields can only be updated for tutor accounts');
  }

  Object.assign(user, normalizedUpdateBody);

  await user.save();
  await accountSyncService.syncTutorFromUser(user);
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const linkedTutor = user.tutorId
    ? await Tutor.findById(user.tutorId)
    : await Tutor.findOne({ $or: [{ userId: user._id }, { email: user.email }] });

  if (linkedTutor) {
    await linkedTutor.remove();
  }

  await user.remove();
  return user;
};

/**
 * Update password for an authenticated user
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const changePassword = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!(await user.isPasswordMatch(updateBody.currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect current password');
  }

  user.password = updateBody.newPassword;
  user.forcePasswordReset = false;

  await user.save();
  await accountSyncService.syncTutorFromUser(user);
  return { message: 'Password updated successfully' };
};

/**
 * @param {ObjectId} userId
 * @returns {Promise<void>}
 */
const generateTemporaryPassword = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  try {
    const tempPassword = generateTempPassword(12);
    if (!tempPassword) throw new Error('Temp password generation failed');
    user.password = tempPassword;
    await user.save();
    await accountSyncService.syncTutorFromUser(user);
    try {
      await emailService.sendTemporaryPasswordEmail(user.email, user.name, tempPassword);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to send temp password email for userId', userId, err);
    }
    return { message: 'Temporary password generated and sent to email' };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate temporary password');
  }
};
/**
 * Create an admin user and email credentials
 * @param {Object} adminBody
 * @returns {Promise<User>}
 */
const createAdminUser = async (adminBody) => {
  const { email, name, phoneNumber, password } = adminBody;

  if (await User.isEmailTaken(email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This email is already in use. Please use a different email.');
  }

  const user = await User.create({
    name,
    email,
    phoneNumber,
    password,
    role: 'admin',
    forcePasswordReset: true,
  });

  const resetToken = await tokenService.generateResetPasswordToken(user.email);
  await emailService.sendAdminInviteEmail(user.email, user.name, resetToken);

  return user;
};

/**
 * Update password for an admin invite flow
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Object>}
 */
const changeAdminPassword = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user || !(await user.isPasswordMatch(updateBody.currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect current password');
  }

  user.password = updateBody.newPassword;
  user.forcePasswordReset = false;

  await user.save();
  return { message: 'Password updated successfully' };
};

/**
 * Returns the admin user's existing referral code, or generates and saves a new one if missing.
 * @param {string} userId
 * @returns {Promise<{ user: object, referralCode: string }>}
 */
const ensureReferralCode = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Referral codes can only be sent to admin users from this endpoint');
  }

  if (user.referralCode) {
    return { user, referralCode: user.referralCode };
  }

  const code = await referralCodeService.generateUniqueReferralCode();
  await User.findByIdAndUpdate(userId, { referralCode: code });
  return { user, referralCode: code };
};

/**
 * Revoke (clear) a user's referral code without deleting their account.
 * For tutor users the code lives on the linked Tutor document; for all
 * others it lives on the User document itself.
 * @param {ObjectId|string} userId
 */
const clearUserReferralCode = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role === 'tutor' && user.tutorId) {
    await Tutor.findByIdAndUpdate(user.tutorId, { $unset: { referralCode: 1 } });
  } else {
    await User.findByIdAndUpdate(userId, { $unset: { referralCode: 1 } });
  }
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  changePassword,
  generateTemporaryPassword,
  createAdminUser,
  changeAdminPassword,
  ensureReferralCode,
  clearUserReferralCode,
};
