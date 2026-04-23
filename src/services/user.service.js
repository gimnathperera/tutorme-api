const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/generatePassword');
const { normalizeUserProfileFields } = require('../utils/availability');
const emailService = require('./email.service');
const accountSyncService = require('./accountSync.service');

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
  const users = await User.paginate(filter, options);
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
  'tutoringLevels',
  'preferredLocations',
  'tutorType',
  'highestEducation',
  'yearsExperience',
  'tutorMediums',
  'academicDetails',
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
  await user.remove();
  return user;
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const changePassword = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (!user || !(await user.isPasswordMatch(updateBody.currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect current password');
  }

  const payload = {
    password: updateBody.newPassword,
  };

  Object.assign(user, payload);

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

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  changePassword,
  generateTemporaryPassword,
};
