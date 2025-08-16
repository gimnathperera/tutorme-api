const httpStatus = require('http-status');
const { TuitionAssignment } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a TuitionAssignment
 * @param {Object} body
 * @returns {Promise<TuitionAssignment>}
 */

const createTuitionAssignment = async (body) => {
  const exists = await TuitionAssignment.findOne({ assignmentNumber: body.assignmentNumber });
  if (exists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Assignment number already exists');
  }
  return TuitionAssignment.create(body);
};

/**
 * Query for TuitionAssignments
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTuitionAssignments = async (filter, options) => {
  const result = await TuitionAssignment.paginate(filter, options);
  return result;
};

/**
 * Get TuitionAssignment by id
 * @param {ObjectId} id
 * @returns {Promise<TuitionAssignment>}
 */
const getTuitionAssignmentById = async (id) => {
  return TuitionAssignment.findById(id).populate('gradeId tutorId');
};

/**
 * Update TuitionAssignment by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<TuitionAssignment>}
 */
const updateTuitionAssignmentById = async (id, updateBody) => {
  const assignment = await getTuitionAssignmentById(id);
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'TuitionAssignment not found');
  }
  if (updateBody.assignmentNumber && updateBody.assignmentNumber !== assignment.assignmentNumber) {
    const exists = await TuitionAssignment.findOne({ assignmentNumber: updateBody.assignmentNumber });
    if (exists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Assignment number already exists');
    }
  }
  Object.assign(assignment, updateBody);
  await assignment.save();
  return assignment;
};

/**
 * Delete TuitionAssignment by id
 * @param {ObjectId} id
 * @returns {Promise<TuitionAssignment>}
 */
const deleteTuitionAssignmentById = async (id) => {
  const assignment = await TuitionAssignment.findById(id);
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'TuitionAssignment not found');
  }
  await assignment.remove();
  return assignment;
};

module.exports = {
  createTuitionAssignment,
  queryTuitionAssignments,
  getTuitionAssignmentById,
  updateTuitionAssignmentById,
  deleteTuitionAssignmentById,
};
