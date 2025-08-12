const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tuitionRatesService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.createTuitionRate(req.body);
  res.status(httpStatus.CREATED).send(tuitionRate);
});

const getTuitionRates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['tutorId', 'subjectId', 'gradeLevel', 'tutorType', 'isActive']);
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

  const result = await tuitionRatesService.queryTuitionRates(filter, options);
  res.send(result);
});

const getTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.getTuitionRateById(req.params.tuitionRateId);
  if (!tuitionRate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tuition rate not found');
  }
  res.send(tuitionRate);
});

const updateTuitionRate = catchAsync(async (req, res) => {
  const tuitionRate = await tuitionRatesService.updateTuitionRateById(req.params.tuitionRateId, req.body);
  res.send(tuitionRate);
});

const deleteTuitionRate = catchAsync(async (req, res) => {
  await tuitionRatesService.deleteTuitionRateById(req.params.tuitionRateId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  updateTuitionRate,
  deleteTuitionRate,
};
