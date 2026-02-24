const httpStatus = require('http-status');
const { Grade } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a grade
 * @param {Object} gradeBody
 * @returns {Promise<Grade>}
 */
const createGrade = async (gradeBody) => {
  if (await Grade.isTitleTaken(gradeBody.title)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title already taken');
  }
  return Grade.create(gradeBody);
};

/**
 * Query for grades
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryGrades = async (filter, options) => {
  const query = { ...filter };
  if (query.title) {
    query.title = { $regex: query.title, $options: 'i' };
  }

  return Grade.paginate(query, options);
};

/**
 * Get grade by id
 * @param {ObjectId} id
 * @returns {Promise<Grade>}
 */
const getGradeById = async (id) => {
  return Grade.findById(id).populate('subjects');
};

const getSubjectsForGrades = async (gradeIds) => {
  const grades = await Grade.find({
    _id: { $in: gradeIds },
  }).populate('subjects');

  if (!grades.length) {
    return [];
  }

  const subjectMap = new Map();

  grades.forEach((grade) => {
    grade.subjects.forEach((subject) => {
      subjectMap.set(subject.id, subject);
    });
  });

  return Array.from(subjectMap.values());
};

/**
 * Update grade by id
 * @param {ObjectId} gradeId
 * @param {Object} updateBody
 * @returns {Promise<Grade>}
 */
const updateGradeById = async (gradeId, updateBody) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  if (updateBody.title && (await Grade.isTitleTaken(updateBody.title, gradeId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title already taken');
  }
  Object.assign(grade, updateBody);
  await grade.save();
  return grade;
};

/**
 * Delete grade by id
 * @param {ObjectId} gradeId
 * @returns {Promise<Grade>}
 */
const deleteGradeById = async (gradeId) => {
  const grade = await getGradeById(gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  await grade.remove();
  return grade;
};

module.exports = {
  createGrade,
  queryGrades,
  getGradeById,
  getSubjectsForGrades,
  updateGradeById,
  deleteGradeById,
};
