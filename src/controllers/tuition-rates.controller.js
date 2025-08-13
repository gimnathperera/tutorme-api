const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tuitionRateService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRateService.createTuitionRate(req.body);
  res.status(httpStatus.CREATED).send(tuitionRate);
});

const queryTuitionRates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['subject', 'grade']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };

  const result = await tuitionRateService.queryTuitionRates(filter, options);

  res.send(result);
});

const getTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRateService.getTuitionRateById(req.params.tuitionRatesId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition Rate not found');
  }
  res.send(tuitionRate);
});

const updateTuitionRatesById = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRateService.updateTuitionRatesById(req.params.tuitionRatesId, req.body);
  res.send(tuitionRate);
});

const deleteTuitionRate = catchAsync(async (req, res) => {
  await tuitionRateService.deleteTuitionRateById(req.params.tuitionRatesId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTuitionRate,
  queryTuitionRates,
  getTuitionRate,
  updateTuitionRatesById,
  deleteTuitionRate,
};
