const httpStatus = require('http-status');
const { Grade, Subject, TuitionRates } = require('../models');
const ApiError = require('../utils/ApiError');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildTuitionRateSearchQuery = async (filter = {}) => {
  const query = { ...filter };
  const searchTerm = typeof query.search === 'string' ? query.search.trim() : '';

  delete query.search;

  if (!searchTerm) {
    return query;
  }

  const searchRegex = new RegExp(escapeRegex(searchTerm), 'i');
  const [grades, subjects] = await Promise.all([
    Grade.find({ title: searchRegex }).select('_id').lean(),
    Subject.find({ title: searchRegex }).select('_id').lean(),
  ]);

  const gradeIds = grades.map((grade) => grade._id);
  const subjectIds = subjects.map((subject) => subject._id);

  query.$or = [{ grade: { $in: gradeIds } }, { subject: { $in: subjectIds } }];

  return query;
};

/**
 * Create a Tuition Rate
 * @param {Object} tuitionRatesBody
 * @returns {Promise<TuitionRates>}
 */
const createTuitionRate = async (tuitionRateBody) => {
  return TuitionRates.create(tuitionRateBody);
};

/**
 * Query for Tuition Rates
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTuitionRates = async (filter, options) => {
  const query = await buildTuitionRateSearchQuery(filter);
  const tuitionRates = await TuitionRates.paginate(query, {
    ...options,
    populate: 'grade subject',
  });
  return tuitionRates;
};

const getTuitionRatesByGradeId = async (gradeId, filter, options) => {
  const grade = await Grade.findById(gradeId).populate('subjects').lean();
  if (!grade) {
    return { results: [], page: 1, limit: 10, totalPages: 0, totalResults: 0 };
  }

  const subjects = grade.subjects || [];

  // Fetch all configured rates for this grade in one query
  const existingRates = await TuitionRates.find({ grade: gradeId }).populate('subject').lean();
  const ratesBySubjectId = new Map(existingRates.map((r) => [r.subject._id.toString(), r]));

  // Build merged list — every subject appears, rate fields are null if not configured
  let merged = subjects.map((subject) => {
    const rate = ratesBySubjectId.get(subject._id.toString());
    if (rate) return rate;
    return {
      subject: { id: subject._id, _id: subject._id, title: subject.title },
      grade: { id: grade._id, _id: grade._id, title: grade.title },
      universityStudentsRate: null,
      partTimeTutorRate: null,
      fullTimeTutorRate: null,
      moeTeacherRate: null,
    };
  });

  // Apply optional search/subject filters
  const searchTerm = typeof filter.search === 'string' ? filter.search.trim() : '';
  if (searchTerm) {
    const searchRegex = new RegExp(escapeRegex(searchTerm), 'i');
    merged = merged.filter((r) => searchRegex.test((r.subject && r.subject.title) || ''));
  }
  if (filter.subject) {
    merged = merged.filter((r) => {
      try {
        return (r.subject && r.subject._id && r.subject._id.toString()) === filter.subject;
      } catch (e) {
        return false;
      }
    });
  }

  // Manual pagination (paginate plugin not usable on plain arrays)
  const totalResults = merged.length;
  const limit = parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const page = parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const totalPages = Math.ceil(totalResults / limit) || 1;
  const results = merged.slice((page - 1) * limit, page * limit);

  return { results, page, limit, totalPages, totalResults };
};

/**
 * Get Tuition Rates by id
 * @param {ObjectId} id
 * @returns {Promise<TuitionRates>}
 */
const getTuitionRateById = async (id) => {
  return TuitionRates.findById(id).populate('grade', 'title').populate('subject', 'title').populate('title');
};

/**
 * Update Tuition Rates by id
 * @param {ObjectId} tuitionRatesId
 * @param {Object} updateBody
 * @returns {Promise<TuitionRates>}
 */
const updateTuitionRatesById = async (tuitionRatesId, updateBody) => {
  const tuitionRate = await getTuitionRateById(tuitionRatesId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition Rate not found');
  }
  Object.assign(tuitionRate, updateBody);
  await tuitionRate.save();
  return tuitionRate;
};

/**
 * Delete tuition Rate by id
 * @param {ObjectId} tuitionRatesId
 * @returns {Promise<TuitionRates>}
 */
const deleteTuitionRateById = async (tuitionRatesId) => {
  const tuitionRate = await getTuitionRateById(tuitionRatesId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition Rate not found');
  }
  await tuitionRate.remove();
  return tuitionRate;
};

module.exports = {
  createTuitionRate,
  queryTuitionRates,
  getTuitionRatesByGradeId,
  getTuitionRateById,
  updateTuitionRatesById,
  deleteTuitionRateById,
};
