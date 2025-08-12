// Import dependencies
const httpStatus = require('http-status');
const { TuitionRate } = require('../models'); // You should have TuitionRate model
const ApiError = require('../utils/ApiError');

/**
 * Create a tuition rate
 * @param {Object} tuitionRateBody - Data for the new tuition rate
 * @returns {Promise<TuitionRate>}
 */
const createTuitionRate = async (tuitionRateBody) => {
  return TuitionRate.create(tuitionRateBody);
};

/**
 * Query for tuition rates with filters and pagination
 * @param {Object} filter - MongoDB filter object (e.g., { tutorType: 'graduate_teacher' })
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<QueryResult>}
 */
const queryTuitionRates = async (filter, options) => {
  const tuitionRates = await TuitionRate.paginate(filter, options);
  return tuitionRates;
};

/**
 * Get a single tuition rate by ID
 * @param {ObjectId} id - MongoDB ObjectId
 * @returns {Promise<TuitionRate|null>}
 */
const getTuitionRateById = async (id) => {
  return TuitionRate.findById(id);
};

/**
 * Update a tuition rate by ID
 * @param {ObjectId} tuitionRateId - MongoDB ObjectId
 * @param {Object} updateBody - Fields to update
 * @returns {Promise<TuitionRate>}
 * @throws {ApiError} - If tuition rate not found
 */
const updateTuitionRateById = async (tuitionRateId, updateBody) => {
  const tuitionRate = await getTuitionRateById(tuitionRateId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition rate not found');
  }
  Object.assign(tuitionRate, updateBody);
  await tuitionRate.save();
  return tuitionRate;
};

/**
 * Delete a tuition rate by ID
 * @param {ObjectId} tuitionRateId - MongoDB ObjectId
 * @returns {Promise<TuitionRate>}
 * @throws {ApiError} - If tuition rate not found
 */
const deleteTuitionRateById = async (tuitionRateId) => {
  const tuitionRate = await getTuitionRateById(tuitionRateId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition rate not found');
  }
  await tuitionRate.remove();
  return tuitionRate;
};

// Export service functions
module.exports = {
  createTuitionRate,
  queryTuitionRates,
  getTuitionRateById,
  updateTuitionRateById,
  deleteTuitionRateById,
};
