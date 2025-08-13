const httpStatus = require('http-status');
const { Tutor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a Tutor
 * @param {Object} tutorBody
 * @returns {Promise<Tutor>}
 */
const createTutor = async (tutorBody) => {
  // Here you could add any business logic before saving
  return Tutor.create(tutorBody);
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

  const tutors = await Tutor.paginate(query, options);
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

module.exports = {
  createTutor,
  queryTutors,
  getTutorById,
  updateTutorById,
  deleteTutorById,
};
