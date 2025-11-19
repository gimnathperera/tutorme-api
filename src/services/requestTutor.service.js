const httpStatus = require('http-status');
const { RequestTutor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Request a Tutor
 */
const requestTutor = async (requestTutorBody) => {
  return RequestTutor.create(requestTutorBody);
};

/**
 * Query for tutor requests
 */
const queryTutorsRequests = async (filter, options) => {
  const requestTutors = await RequestTutor.paginate(filter, {
    ...options,
    populate: 'grade,tutors.subjects',
  });
  return requestTutors;
};

/**
 * Get tutor request by id
 */
const getRequestTutorById = async (id) => {
  return RequestTutor.findById(id).populate('grade').populate('tutors.subjects');
};

/**
 * Delete tutor request
 */
const deleteTutorRequestById = async (requestTutorId) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }
  await tutorRequest.remove();
  return tutorRequest;
};

/**
 * Update ONLY the status
 */
const updateStatusById = async (requestTutorId, status) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  tutorRequest.status = status;
  await tutorRequest.save();
  return tutorRequest;
};

/**
 * Update ONLY the assigned tutor
 */
const updateAssignedTutorById = async (requestTutorId, assignedTutor) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  tutorRequest.assignedTutor = assignedTutor;
  await tutorRequest.save();
  return tutorRequest;
};

module.exports = {
  requestTutor,
  queryTutorsRequests,
  getRequestTutorById,
  deleteTutorRequestById,
  updateStatusById,
  updateAssignedTutorById,
};
