const httpStatus = require('http-status');
const { RequestTutor } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const logger = require('../config/logger');

const sendAcknowledgement = async (requestTutorBody) => {
  try {
    await emailService.sendAcknowledgement(requestTutorBody);
  } catch (err) {
    logger.error({ err }, 'Failed to send acknowledgement email');
  }
};

/**
 * Request a Tutor
 */
const requestTutor = async (requestTutorBody) => {
  logger.info({ requestTutorBody }, 'Tutor request created');

  const tutorCreateResponse = await RequestTutor.create(requestTutorBody);
  if (tutorCreateResponse) {
    sendAcknowledgement(requestTutorBody);
  }
  return tutorCreateResponse;
};

/**
 * Query for tutor requests
 */
const queryTutorsRequests = async (filter, options) => {
  const requestTutors = await RequestTutor.paginate(filter, {
    ...options,
  });
  return requestTutors;
};

/**
 * Get tutor request by id
 */
const getRequestTutorById = async (id) => {
  return RequestTutor.findById(id);
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
 * Update ONLY the assigned tutor for a specific tutor block
 */
const updateAssignedTutorByBlockId = async (tutorBlockId, assignedTutor) => {
  const tutorRequest = await RequestTutor.findOne({ 'tutors._id': tutorBlockId });
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request or tutor block not found');
  }
  const tutorBlock = tutorRequest.tutors.id(tutorBlockId);
  if (!tutorBlock) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor block not found');
  }
  tutorBlock.assignedTutor = assignedTutor;

  await tutorRequest.save();
  return tutorRequest;
};

module.exports = {
  requestTutor,
  queryTutorsRequests,
  getRequestTutorById,
  deleteTutorRequestById,
  updateStatusById,
  updateAssignedTutorByBlockId,
};
