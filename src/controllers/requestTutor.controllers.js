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
  const filter = pick(req.query, [
    'search',
    'name',
    'email',
    'city',
    'district',
    'grade',
    'medium',
    'status',
    'phoneNumber',
    'subject',
    'assignedTutor',
    'preferredTutorType',
    'preferredClassType',
    'duration',
    'frequency',
  ]);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };
  const result = await requestTutorService.queryTutorsRequests(filter, options);
  res.send(result);
});

const getTutorById = catchAsync(async (req, res) => {
  const requestTutors = await requestTutorService.getRequestTutorByIdWithGradeName(req.params.requestTutorId);
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
  const { status, rejectionReason } = req.body;

  const updated = await requestTutorService.updateStatusById(requestTutorId, status, rejectionReason);
  res.send(updated);
});

const updateAssignedTutor = catchAsync(async (req, res) => {
  const { requestTutorId } = req.params;
  const { assignedTutor, tutorBlockId } = req.body;

  const updated = await requestTutorService.updateAssignedTutor(requestTutorId, assignedTutor, tutorBlockId);

  res.send(updated);
});

const sendTutorMatchReport = catchAsync(async (req, res) => {
  const result = await requestTutorService.sendTutorMatchReportToAdmin(req.params.requestTutorId);
  res.send(result);
});

const sendTelegramOutreach = catchAsync(async (req, res) => {
  const result = await requestTutorService.sendTelegramOutreach(req.params.requestTutorId, req.user);
  res.send(result);
});

module.exports = {
  createTutorRequest,
  getTutorRequests,
  getTutorById,
  deleteTutor,
  updateStatus,
  updateAssignedTutor,
  sendTutorMatchReport,
  sendTelegramOutreach,
};
