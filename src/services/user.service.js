const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/generatePassword');
const tokenService = require('./token.service');
const emailService = require('./email.service');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This email is already in use. Please sign in or use a different email.');
  }
  return User.create(userBody);
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

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  Object.assign(user, updateBody);

  await user.save();
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
 * @param {ObjectId} userId
 * @returns {Promise<void>}
 */
const generateTemporaryPassword = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  try {
    const tempPassword = generateTempPassword(12);
    if (!tempPassword) throw new Error('Temp password generation failed');
    user.password = await bcrypt.hash(tempPassword, 10);
    await user.save();
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

const changePassword = async (userId, updateBody) => {
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

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  generateTemporaryPassword,
  createAdminUser,
  changePassword,
};
