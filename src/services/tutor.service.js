const httpStatus = require('http-status');
const { Tutor } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateTempPassword } = require('../utils/generatePassword');
const logger = require('../config/logger');
const emailService = require('./email.service');

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
 * Create a Tutor
 * @param {Object} tutorBody
 * @returns {Promise<Tutor>}
 */
const createTutor = async (tutorBody) => {
  // Block suspended emails from re-registering
  await checkEmailSuspended(tutorBody.email);

  const tutor = await Tutor.create({ ...tutorBody, status: 'pending' });
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

  if (filter.preferredLocations) {
    query.preferredLocations = { $in: filter.preferredLocations };
  }
  if (filter.tutorType) {
    query.tutorType = filter.tutorType;
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
  Object.assign(tutor, updateBody);
  await tutor.save();
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
};
