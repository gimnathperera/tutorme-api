const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { gradeService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.createGrade(req.body);
  res.status(httpStatus.CREATED).send(grade);
});

const getGrades = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title']);

  const options = { ...pick(req.query, ['sortBy', 'limit', 'page']), populate: 'subjects.subject' };

  const result = await gradeService.queryGrades(filter, options);
  res.send(result);
});

const getGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.getGradeById(req.params.gradeId);
  if (!grade) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Grade not found');
  }
  res.send(grade);
});

const getSubjectsForGrades = catchAsync(async (req, res) => {
  const { gradeIds } = req.body;

  const subjects = await gradeService.getSubjectsForGrades(gradeIds);

  res.send({
    count: subjects.length,
    subjects,
  });
});

const updateGrade = catchAsync(async (req, res) => {
  const grade = await gradeService.updateGradeById(req.params.gradeId, req.body);
  res.send(grade);
});

const deleteGrade = catchAsync(async (req, res) => {
  await gradeService.deleteGradeById(req.params.gradeId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createGrade,
  getGrades,
  getGrade,
  getSubjectsForGrades,
  updateGrade,
  deleteGrade,
};
