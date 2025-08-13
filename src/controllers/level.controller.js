const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { levelService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createLevel = catchAsync(async (req, res) => {
  const level = await levelService.createLevel(req.body);
  res.status(httpStatus.CREATED).send(level);
});

const getLevels = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title']);

  const options = { ...pick(req.query, ['sortBy', 'limit', 'page']), populate: 'subjects.subject' };

  const result = await levelService.queryLevels(filter, options);
  res.send(result);
});

const getLevel = catchAsync(async (req, res) => {
  const level = await levelService.getLevelById(req.params.levelId);
  if (!level) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Level not found');
  }
  res.send(level);
});

const updateLevel = catchAsync(async (req, res) => {
  const level = await levelService.updateLevelById(req.params.levelId, req.body);
  res.send(level);
});

const deleteLevel = catchAsync(async (req, res) => {
  await levelService.deleteLevelById(req.params.levelId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createLevel,
  getLevels,
  getLevel,
  updateLevel,
  deleteLevel,
};
