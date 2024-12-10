const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tutorService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTutor = catchAsync(async (req, res) => {
  const tutor = await tutorService.createTutor(req.body);
  res.status(httpStatus.CREATED).send(tutor);
});

const getTutors = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'subject']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };

  const result = await tutorService.queryTutors(filter, options);

  res.send(result);
});

const getTutor = catchAsync(async (req, res) => {
  const tutor = await tutorService.getTutorById(req.params.tutorId);
  if (!tutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }
  res.send(tutor);
});

const updateTutor = catchAsync(async (req, res) => {
  const tutor = await tutorService.updateTutorById(req.params.tutorId, req.body);
  res.send(tutor);
});

const deleteTutor = catchAsync(async (req, res) => {
  await tutorService.deleteTutorById(req.params.tutorId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTutor,
  getTutors,
  getTutor,
  updateTutor,
  deleteTutor,
};
