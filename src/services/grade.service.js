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

const getValueByPath = (object, path) =>
  path.split('.').reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), object);

const sortResults = (results, sortBy) => {
  if (!sortBy) {
    return results;
  }

  const sortingCriteria = sortBy.split(',').map((sortOption) => {
    const [key, order] = sortOption.split(':');
    return {
      key,
      direction: order === 'desc' ? -1 : 1,
    };
  });

  return [...results].sort((left, right) =>
    sortingCriteria.reduce((comparison, { key, direction }) => {
      if (comparison !== 0) {
        return comparison;
      }

      const leftValue = getValueByPath(left, key);
      const rightValue = getValueByPath(right, key);

      if (leftValue === rightValue) {
        return 0;
      }

      if (leftValue === undefined || leftValue === null) {
        return -1 * direction;
      }

      if (rightValue === undefined || rightValue === null) {
        return 1 * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true }) * direction;
    }, 0)
  );
};

const paginateResults = (results, options = {}) => {
  const shouldPaginate = options.page !== undefined || options.limit !== undefined;
  const totalResults = results.length;
  const limit = shouldPaginate && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : totalResults || 10;
  const page = shouldPaginate && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;
  const pagedResults = shouldPaginate ? results.slice(skip, skip + limit) : results;
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: pagedResults,
    subjects: pagedResults,
    count: totalResults,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

const getSubjectsForGrades = async (gradeIds, options = {}) => {
  const grades = await Grade.find({
    _id: { $in: gradeIds },
  }).populate('subjects');

  if (!grades.length) {
    return paginateResults([], options);
  }

  const subjectMap = new Map();

  grades.forEach((grade) => {
    grade.subjects.forEach((subject) => {
      subjectMap.set(subject.id, subject);
    });
  });

  const subjects = sortResults(Array.from(subjectMap.values()), options.sortBy);

  return paginateResults(subjects, options);
};

const getGradesWithTuitionRateCounts = async () => {
  const grades = await Grade.aggregate([
    {
      $lookup: {
        from: 'tuitionrates',
        localField: '_id',
        foreignField: 'grade',
        as: 'tuitionRates',
      },
    },
    {
      $addFields: {
        tuitionRateCount: { $size: '$tuitionRates' },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        tuitionRateCount: 1,
      },
    },
    {
      $sort: { title: 1 },
    },
  ]);

  return grades;
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
  getGradesWithTuitionRateCounts,
  updateGradeById,
  deleteGradeById,
};
