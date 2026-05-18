const httpStatus = require('http-status');
const { Grade } = require('../models');
const ApiError = require('../utils/ApiError');

const prepareGradeQuery = (filter) => {
  const query = { ...filter };

  if (query.title) {
    query.title = { $regex: query.title, $options: 'i' };
  }

  return query;
};

const buildSortObject = (sortBy, defaultSort = { title: 1 }) => {
  if (!sortBy) {
    return defaultSort;
  }

  return sortBy.split(',').reduce((sort, sortOption) => {
    const [key, order] = sortOption.split(':');
    return {
      ...sort,
      [key]: order === 'desc' ? -1 : 1,
    };
  }, {});
};

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
  const query = prepareGradeQuery(filter);
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

const paginateArray = (items, options = {}) => {
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;
  const results = items.slice(skip, skip + limit);
  const totalResults = items.length;
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results,
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
    return {
      results: [],
      subjects: [],
      count: 0,
      page: options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1,
      limit: options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10,
      totalPages: 0,
      totalResults: 0,
    };
  }

  const subjectMap = new Map();

  grades.forEach((grade) => {
    grade.subjects.forEach((subject) => {
      subjectMap.set(subject.id, subject);
    });
  });

  const paginatedSubjects = paginateArray(Array.from(subjectMap.values()), options);

  return {
    ...paginatedSubjects,
    subjects: paginatedSubjects.results,
    count: paginatedSubjects.results.length,
  };
};

const getGradesWithTuitionRateCounts = async (filter, options = {}) => {
  const query = prepareGradeQuery(filter);
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const skip = (page - 1) * limit;
  const sort = buildSortObject(options.sortBy);

  const [totalResults, grades] = await Promise.all([
    Grade.countDocuments(query).exec(),
    Grade.aggregate([
      {
        $match: query,
      },
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
        $sort: sort,
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]),
  ]);

  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: grades,
    page,
    limit,
    totalPages,
    totalResults,
  };
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
