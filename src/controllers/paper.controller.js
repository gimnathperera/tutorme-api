const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { paperService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createPaper = catchAsync(async (req, res) => {
  const paper = await paperService.createPaper(req.body);
  res.status(httpStatus.CREATED).send(paper);
});

const getPapers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'grade', 'subject', 'medium']);

  const options = { ...pick(req.query, ['sortBy', 'limit', 'page', 'order']), populate: 'grade,subject' };

  const result = await paperService.queryPapers(filter, options);
  res.send(result);
});

const getPaper = catchAsync(async (req, res) => {
  const paper = await paperService.getPaperById(req.params.paperId);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }
  res.send(paper);
});

const updatePaper = catchAsync(async (req, res) => {
  const paper = await paperService.updatePaperById(req.params.paperId, req.body);
  res.send(paper);
});

const deletePaper = catchAsync(async (req, res) => {
  await paperService.deletePaperById(req.params.paperId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPaper,
  getPapers,
  getPaper,
  updatePaper,
  deletePaper,
};
