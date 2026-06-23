const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, emailService } = require('../services');
const { serializeUserProfile } = require('../utils/availability');
const logger = require('../config/logger');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(serializeUserProfile(user));
});

const createAdmin = catchAsync(async (req, res) => {
  const adminBody = {
    name: req.body.name,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    role: 'admin',
    forcePasswordReset: true,
  };

  const user = await userService.createUser(adminBody);
  const resetToken = await tokenService.generateResetPasswordToken(user.email);
  await emailService.sendAdminInviteEmail(user.email, user.name, resetToken);

  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'search',
    'id',
    'email',
    'phoneNumber',
    'birthday',
    'status',
    'country',
    'city',
    'state',
    'region',
    'zip',
    'address',
    'tutorType',
    'gender',
    'duration',
    'frequency',
    'timeZone',
    'language',
    'avatar',
    'createdAt',
    'name',
    'role',
    'roles',
    'hasReferralCode',
  ]);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
    populate: 'grades.grade,subjects.subject',
  };

  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(serializeUserProfile(user));
});

const updateUser = catchAsync(async (req, res) => {
  const { rejectionMessage, ...updateBody } = req.body;

  const existingUser = await userService.getUserById(req.params.userId);
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const oldStatus = existingUser.status;
  const newStatus = updateBody.status;

  const user = await userService.updateUserById(req.params.userId, updateBody, req.user);

  // Fire status-change emails (fire-and-forget — never block the response)
  if (newStatus && newStatus !== oldStatus) {
    const fireEmail = async () => {
      try {
        if (newStatus === 'approved') {
          await emailService.sendAdminApprovedEmail(user.email, user.name);
        } else if (newStatus === 'rejected') {
          await emailService.sendAdminRejectedEmail(user.email, user.name, rejectionMessage || '');
        } else if (newStatus === 'suspended') {
          await emailService.sendAdminSuspendedEmail(user.email, user.name);
        }
      } catch (emailErr) {
        logger.warn(`Status email failed for user ${user.id} (${oldStatus} → ${newStatus}): ${emailErr.message}`);
      }
    };
    fireEmail();
  }

  res.send(serializeUserProfile(user));
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const result = await userService.changePassword(req.params.userId, req.body);
  res.send(result);
});

const generateTempPassword = catchAsync(async (req, res) => {
  const result = await userService.generateTemporaryPassword(req.params.userId);
  res.send(result);
});

const sendReferralCode = catchAsync(async (req, res) => {
  const { user, referralCode } = await userService.ensureReferralCode(req.params.userId);
  await emailService.sendReferralCodeEmail(user.email, user.name, referralCode);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  createAdmin,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  generateTempPassword,
  sendReferralCode,
};
