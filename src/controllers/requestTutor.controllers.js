const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { requestTutorService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTutorRequest = catchAsync(async (req, res) => {
  const requestTutors = await requestTutorService.requestTutor(req.body);
  res.status(httpStatus.CREATED).send(requestTutors);
});

const getTutorRequests = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['firstName']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
    populate: 'grade,tutors.subjects',
  };
  const result = await requestTutorService.queryTutorsRequests(filter, options);
  res.send(result);
});

const getTutorById = catchAsync(async (req, res) => {
  const requestTutors = await requestTutorService.getRequestTutorById(req.params.requestTutorId);
  if (!requestTutors) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }
  res.send(requestTutors);
});

const deleteTutor = catchAsync(async (req, res) => {
  await requestTutorService.deleteTutorRequestById(req.params.requestTutorId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateStatus = catchAsync(async (req, res) => {
  const { requestTutorId } = req.params;
  const { status } = req.body;

  const updated = await requestTutorService.updateStatusById(requestTutorId, status);
  res.send(updated);
});

const updateAssignedTutor = catchAsync(async (req, res) => {
  const { requestTutorId } = req.params;
  const { assignedTutor } = req.body;

  const updated = await requestTutorService.updateAssignedTutorById(requestTutorId, assignedTutor);
  res.send(updated);
});

module.exports = {
  createTutorRequest,
  getTutorRequests,
  getTutorById,
  deleteTutor,
  updateStatus,
  updateAssignedTutor,
};
