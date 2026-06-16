const httpStatus = require('http-status');
const { Tutor, User, ReferralReward } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/generatePassword');
const logger = require('../config/logger');
const emailService = require('./email.service');
const accountSyncService = require('./accountSync.service');
const referralCodeService = require('./referralCode.service');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toArray = (value) => (Array.isArray(value) ? value : [value]);

/**
 * Check if an email belongs to a suspended tutor.
 * Throws 403 FORBIDDEN if suspended so they cannot re-register.
 * @param {string} email
 * @returns {Promise<void>}
 */
const checkEmailSuspended = async (email) => {
  const existing = await Tutor.findOne({ email: email.toLowerCase().trim() }).select('status').lean();
  if (existing && existing.status === 'suspended') {
    throw new ApiError(httpStatus.FORBIDDEN, 'This email has been suspended. Please contact admin.');
  }
};

/**
 * Check whether a tutor registration email can be used.
 * @param {string} email
 * @returns {Promise<{available: boolean, message: string}>}
 */
const getEmailAvailability = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const [existingUser, existingTutor] = await Promise.all([
    User.findOne({ email: normalizedEmail }).select('_id').lean(),
    Tutor.findOne({ email: normalizedEmail }).select('_id status').lean(),
  ]);

  if (existingTutor) {
    if (existingTutor.status === 'suspended') {
      return { available: false, message: 'This email has been suspended. Please contact admin.' };
    }
    if (existingTutor.status === 'pending') {
      return { available: false, message: 'A registration with this email is already pending approval.' };
    }
    if (existingTutor.status === 'approved') {
      return { available: false, message: 'Email already exists' };
    }
    // rejected tutors are allowed to re-register regardless of whether a User record exists
    return { available: true, message: 'Email is available' };
  }

  if (existingUser) {
    return { available: false, message: 'Email already exists' };
  }

  return { available: true, message: 'Email is available' };
};

/**
 * Ensure the tutor registration email is not already used by a user or tutor.
 * Throws 400 BAD_REQUEST before any tutor record or notification email is created.
 * @param {string} email
 * @returns {Promise<void>}
 */
const checkEmailAvailable = async (email) => {
  const availability = await getEmailAvailability(email);
  if (!availability.available) {
    throw new ApiError(httpStatus.BAD_REQUEST, availability.message);
  }
};

/**
 * Validate that a referral code exists and belongs to an active tutor.
 * Returns the referrer tutor document or null if invalid.
 * @param {string} code
 * @returns {Promise<Tutor|null>}
 */
const findTutorByReferralCode = async (code) => {
  if (!code) return null;
  return Tutor.findOne({ referralCode: code.toUpperCase().trim() }).select('_id referralCode').lean();
};

/**
 * Create a Tutor
 * @param {Object} tutorBody
 * @returns {Promise<Tutor>}
 */
const createTutor = async (tutorBody) => {
  // Block suspended emails from re-registering
  await checkEmailSuspended(tutorBody.email);
  await checkEmailAvailable(tutorBody.email);

  const referredByCode = tutorBody.referredByCode ? tutorBody.referredByCode.toUpperCase().trim() : undefined;

  // Validate referral code if provided — may belong to a tutor or an admin user
  let referrer = null;
  if (referredByCode) {
    referrer = await referralCodeService.findReferrerByReferralCode(referredByCode);
    if (!referrer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid referral code');
    }
  }

  const tutor = await Tutor.create({
    ...tutorBody,
    status: 'pending',
    referredByCode: referredByCode || undefined,
  });

  // Create referral reward entry if a valid referral code was used
  if (referrer) {
    try {
      await ReferralReward.create({
        referrerTutorId: referrer.id,
        referrerModel: referrer.type,
        referredTutorId: tutor._id,
        rewardSent: false,
      });
    } catch (rewardErr) {
      logger.warn(`Failed to create referral reward for tutor ${tutor.id}: ${rewardErr.message}`);
    }
  }

  try {
    await emailService.sendTutorRegistrationPendingEmail(tutor.email, tutor.fullName);
  } catch (emailErr) {
    // Log but don't fail registration if email fails
    logger.warn(`Tutor registered but failed to send pending email to ${tutor.email}: ${emailErr.message}`);
  }
  return tutor;
};

/**
 * Query for tutors
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTutors = async (filter, options) => {
  const query = { ...filter };
  const searchTerm = typeof query.search === 'string' ? query.search.trim() : '';

  delete query.search;

  if (filter.preferredLocations) {
    query.preferredLocations = { $in: toArray(filter.preferredLocations) };
  }
  if (filter.tutorType) {
    query.tutorType = Array.isArray(filter.tutorType) ? { $in: filter.tutorType } : filter.tutorType;
  }

  // Filter tutors that support the requested grade
  if (filter.gradeId) {
    query.grades = { $in: [filter.gradeId] };
    delete query.gradeId;
  }

  // Filter tutors that support the requested subject
  if (filter.subjectId) {
    query.subjects = { $in: [filter.subjectId] };
    delete query.subjectId;
  }

  if (searchTerm) {
    const searchRegex = new RegExp(escapeRegex(searchTerm), 'i');
    query.$or = [{ fullName: searchRegex }, { email: searchRegex }, { contactNumber: searchRegex }];
  }

  const sortOptions = { ...options };

  if (!sortOptions.sortBy) {
    sortOptions.sortBy = 'createdAt:desc';
  }

  const tutors = await Tutor.paginate(query, sortOptions);
  return tutors;
};

/**
 * Get tutor by id
 * @param {ObjectId} id
 * @returns {Promise<Tutor>}
 */
const getTutorById = async (id) => {
  return Tutor.findById(id);
};

/**
 * Update tutor by id
 * @param {ObjectId} tutorId
 * @param {Object} updateBody
 * @returns {Promise<Tutor>}
 */
const updateTutorById = async (tutorId, updateBody) => {
  const tutor = await getTutorById(tutorId);
  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }
  const updatePayload = { ...updateBody };
  if (updateBody.status === 'approved' && tutor.status !== 'approved') {
    updatePayload.approvedAt = new Date();
  }
  Object.assign(tutor, updatePayload);
  await tutor.save();
  await accountSyncService.syncUserFromTutor(tutor);
  return tutor;
};

/**
 * Delete tutor by id
 * @param {ObjectId} tutorId
 * @returns {Promise<Tutor>}
 */
const deleteTutorById = async (tutorId) => {
  const tutor = await getTutorById(tutorId);
  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }

  const linkedUser = tutor.userId
    ? await User.findById(tutor.userId)
    : await User.findOne({ $or: [{ tutorId: tutor._id }, { email: tutor.email }] });

  if (linkedUser) {
    await linkedUser.remove();
  }

  await tutor.remove();
  return tutor;
};
const changePassword = async (tutorId, updateBody) => {
  const tutor = await getTutorById(tutorId);

  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }

  if (!tutor || !(await tutor.isPasswordMatch(updateBody.currentPassword))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect current password');
  }

  const payload = {
    password: updateBody.newPassword,
  };

  Object.assign(tutor, payload);

  await tutor.save();
  await accountSyncService.syncUserFromTutor(tutor);
  return { message: 'Password updated successfully' };
};
/**
 * Generate a temporary password for a user and send it via email
 * @param {ObjectId} tutorId
 * @returns {Promise<void>}
 */

const generateTemporaryPassword = async (tutorId) => {
  const tutor = await getTutorById(tutorId);
  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }
  try {
    const tempPassword = generateTempPassword();
    tutor.password = tempPassword;
    await tutor.save();
    await accountSyncService.syncUserFromTutor(tutor);
    await emailService.sendTemporaryPasswordEmail(tutor.email, tutor.fullName, tempPassword);
    return { message: 'Temporary password generated and sent to email' };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate temporary password');
  }
};

// Find Tutors by Subjects
const findTutorsBySubjects = async (subjects, tutorType) => {
  const query = {
    subjects: { $all: subjects },
  };

  if (tutorType) {
    query.tutorType = tutorType;
  }

  return Tutor.find(query).select('fullName email tutorType subjects').lean();
};

/**
 * Returns the tutor's existing referral code, or generates and saves a new one if missing.
 * @param {string} tutorId
 * @returns {Promise<{ tutor: object, referralCode: string }>}
 */
const ensureReferralCode = async (tutorId) => {
  const tutor = await Tutor.findById(tutorId).lean();
  if (!tutor) throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');

  if (tutor.referralCode) {
    return { tutor, referralCode: tutor.referralCode };
  }

  const code = await referralCodeService.generateUniqueReferralCode();
  await Tutor.findByIdAndUpdate(tutorId, { referralCode: code });
  return { tutor, referralCode: code };
};

module.exports = {
  createTutor,
  queryTutors,
  getTutorById,
  updateTutorById,
  deleteTutorById,
  changePassword,
  generateTemporaryPassword,
  findTutorsBySubjects,
  checkEmailSuspended,
  checkEmailAvailable,
  getEmailAvailability,
  findTutorByReferralCode,
  ensureReferralCode,
};
