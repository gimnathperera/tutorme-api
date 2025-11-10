const httpStatus = require('http-status');
const { TuitionRates } = require('../models');
const ApiError = require('../utils/ApiError');

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
  const tuitionRates = await TuitionRates.paginate(filter, {
    ...options,
    populate: 'grade subject', // <-- pass a string here
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
  getTuitionRateById,
  updateTuitionRatesById,
  deleteTuitionRateById,
};
