const httpStatus = require('http-status');
const { Subject } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a subject
 * @param {Object} subjectBody
 * @returns {Promise<Subject>}
 */
const createSubject = async (subjectBody) => {
  return Subject.create(subjectBody);
};

/**
 * Query for subjects
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const querySubjects = async (filter, options) => {
  const query = { ...filter };
  if (query.title) {
    query.title = { $regex: query.title, $options: 'i' };
  }
  return Subject.paginate(query, options);
};

/**
 * Get subject by id
 * @param {ObjectId} id
 * @returns {Promise<Subject>}
 */
const getSubjectById = async (id) => {
  return Subject.findById(id);
};

/**
 * Update subject by id
 * @param {ObjectId} subjectId
 * @param {Object} updateBody
 * @returns {Promise<Subject>}
 */
const updateSubjectById = async (subjectId, updateBody) => {
  const subject = await getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }
  if (updateBody.name && (await Subject.isNameTaken(updateBody.name, subjectId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name already taken');
  }
  Object.assign(subject, updateBody);
  await subject.save();
  return subject;
};

/**
 * Delete subject by id
 * @param {ObjectId} subjectId
 * @returns {Promise<Subject>}
 */
const deleteSubjectById = async (subjectId) => {
  const subject = await getSubjectById(subjectId);
  if (!subject) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Subject not found');
  }
  await subject.remove();
  return subject;
};

module.exports = {
  createSubject,
  querySubjects,
  getSubjectById,
  updateSubjectById,
  deleteSubjectById,
};
