const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tuitionAssignmentService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTuitionAssignment = catchAsync(async (req, res) => {
  const assignment = await tuitionAssignmentService.createTuitionAssignment(req.body);
  res.status(httpStatus.CREATED).send(assignment);
});

const getTuitionAssignments = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'gradeId', 'tutorId']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
    populate: 'gradeId tutorId',
  };

  const result = await tuitionAssignmentService.queryTuitionAssignments(filter, options);
  res.send(result);
});

const getTuitionAssignment = catchAsync(async (req, res) => {
  const assignment = await tuitionAssignmentService.getTuitionAssignmentById(req.params.tuitionAssignmentId);
  if (!assignment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'TuitionAssignment not found');
  }
  res.send(assignment);
});

const updateTuitionAssignment = catchAsync(async (req, res) => {
  const assignment = await tuitionAssignmentService.updateTuitionAssignmentById(req.params.tuitionAssignmentId, req.body);
  res.send(assignment);
});

const deleteTuitionAssignment = catchAsync(async (req, res) => {
  await tuitionAssignmentService.deleteTuitionAssignmentById(req.params.tuitionAssignmentId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTuitionAssignment,
  getTuitionAssignments,
  getTuitionAssignment,
  updateTuitionAssignment,
  deleteTuitionAssignment,
};
