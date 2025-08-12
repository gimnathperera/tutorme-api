// Import required modules and utilities
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tuitionRatesService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

/**
 * Create a new tuition rate
 */
const createTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.createTuitionRate(req.body);
  res.status(httpStatus.CREATED).send(tuitionRate);
});

/**
 * Get a list of tuition rates (with filtering, pagination, and sorting)
 */
const getTuitionRates = catchAsync(async (req, res) => {
  // Pick filterable fields from the query string
  const filter = pick(req.query, ['tutorType', 'gradeLevel', 'currency']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };

  // Handle rate range filtering
  if (req.query.minRateFrom) {
    filter.minRate = { $gte: Number(req.query.minRateFrom) };
  }
  if (req.query.maxRateTo) {
    filter.maxRate = { $lte: Number(req.query.maxRateTo) };
  }
  // Query the database for tuition rates with the given filters and options
  const result = await tuitionRatesService.queryTuitionRates(filter, options);
  res.send(result);
});

/**
 * Get a single tuition rate by ID
 */
const getTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.getTuitionRateById(req.params.tuitionRateId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition rate not found');
  }
  res.send(tuitionRate);
});

/**
 * Update a tuition rate by ID
 */
const updateTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.updateTuitionRateById(req.params.tuitionRateId, req.body);
  res.send(tuitionRate);
});

/**
 * Delete a tuition rate by ID
 */
const deleteTuitionRate = catchAsync(async (req, res) => {
  await tuitionRatesService.deleteTuitionRateById(req.params.tuitionRateId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Export all controller functions
module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  updateTuitionRate,
  deleteTuitionRate,
};
