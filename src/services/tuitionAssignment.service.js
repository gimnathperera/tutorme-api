const httpStatus = require('http-status');
const { TuitionAssignment, Grade, Tutor } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a TuitionAssignment
 * @param {Object} body
 * @returns {Promise<TuitionAssignment>}
 */

const enrichAssignment = async (assignment) => {
  const obj = assignment.toObject();
  const grade = await Grade.findById(obj.gradeId);
  const tutor = await Tutor.findById(obj.tutorId);

  obj.gradeName = grade ? grade.title || '' : '';
  obj.tutorName =
    tutor && tutor.personalInfo ? `${tutor.personalInfo.firstName || ''} ${tutor.personalInfo.lastName || ''}`.trim() : '';
  obj.tutorGender = tutor && tutor.personalInfo ? tutor.personalInfo.genderPreference || '' : '';
  obj.tutorType = tutor && tutor.tutorTypeInfo ? tutor.tutorTypeInfo.tutorType || '' : '';

  // Rename _id to id and remove __v
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;

  return obj;
};

const createTuitionAssignment = async (body) => {
  const exists = await TuitionAssignment.findOne({ assignmentNumber: body.assignmentNumber });
  if (exists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Assignment number already exists');
  }
  const assignment = await TuitionAssignment.create(body);
  return enrichAssignment(assignment);
};

/**
 * Query for TuitionAssignments
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTuitionAssignments = async (filter, options) => {
  const result = await TuitionAssignment.paginate(filter, options);
  result.results = await Promise.all(result.results.map(enrichAssignment));
  return result;
};

/**
 * Get TuitionAssignment by id
 * @param {ObjectId} id
 * @returns {Promise<TuitionAssignment>}
 */
const getTuitionAssignmentById = async (id) => {
  const assignment = await TuitionAssignment.findById(id);
  if (!assignment) return null;
  return enrichAssignment(assignment);
};

/**
 * Update TuitionAssignment by id
 * @param {ObjectId} id
 * @param {Object} updateBody
 * @returns {Promise<TuitionAssignment>}
 */
const updateTuitionAssignmentById = async (id, updateBody) => {
  const assignment = await TuitionAssignment.findById(id);
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
  return enrichAssignment(assignment);
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
