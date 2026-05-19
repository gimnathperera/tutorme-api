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
  const query = await buildTuitionRateSearchQuery({
    grade: gradeId,
    ...filter,
  });

  const tuitionRates = await TuitionRates.paginate(query, {
    ...options,
    populate: 'grade subject',
  });

  return tuitionRates;
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
