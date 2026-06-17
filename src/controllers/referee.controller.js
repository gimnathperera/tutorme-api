const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const pick = require('../utils/pick');
const { refereeService } = require('../services');

const createReferee = catchAsync(async (req, res) => {
  const referee = await refereeService.createReferee(req.body);
  res.status(httpStatus.CREATED).send(referee);
});

const getReferees = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await refereeService.queryReferees(filter, options);
  res.send(result);
});

const getEmailAvailability = catchAsync(async (req, res) => {
  const availability = await refereeService.getEmailAvailability(req.query.email);
  res.send(availability);
});

const updateReferee = catchAsync(async (req, res) => {
  const referee = await refereeService.updateReferee(req.params.refereeId, req.body);
  res.send(referee);
});

const deleteReferee = catchAsync(async (req, res) => {
  await refereeService.deleteReferee(req.params.refereeId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createReferee,
  getReferees,
  getEmailAvailability,
  updateReferee,
  deleteReferee,
};
