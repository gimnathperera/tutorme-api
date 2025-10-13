const httpStatus = require('http-status');
const { RequestTutor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Request a Tutor
 * @param {Object} requestTutorBody
 * @returns {Promise<RequestTutor>}
 */
const requestTutor = async (requestTutorBody) => {
  return RequestTutor.create(requestTutorBody);
};

/**
 * Query for tutor requests
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTutorsRequests = async (filter, options) => {
  const requestTutors = await RequestTutor.paginate(filter, {
    ...options,
    populate: 'grade,tutors.subjects',
  });
  return requestTutors;
};

/**
 * Get requested tutor requests by id
 * @param {ObjectId} id
 * @returns {Promise<RequestTutor>}
 */
const getRequestTutorById = async (id) => {
  return RequestTutor.findById(id).populate('grade').populate('tutors.subjects');
};

/**
 * Delete tutor requests by id
 * @param {ObjectId} requestTutorId
 * @returns {Promise<RequestTutor>}
 */
const deleteTutorRequestById = async (requestTutorId) => {
  const requestTutors = await getRequestTutorById(requestTutorId);
  if (!requestTutors) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }
  await requestTutors.remove();
  return requestTutors;
};

module.exports = {
  requestTutor,
  queryTutorsRequests,
  getRequestTutorById,
  deleteTutorRequestById,
};
