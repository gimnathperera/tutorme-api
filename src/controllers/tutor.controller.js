const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { tutorService, emailService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const logger = require('../config/logger');

const createTutor = catchAsync(async (req, res) => {
  const tutor = await tutorService.createTutor(req.body);
  res.status(httpStatus.CREATED).send(tutor);
});

const getTutors = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['tutorType', 'preferredLocations', 'gradeId', 'subjectId']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await tutorService.queryTutors(filter, options);
  res.send(result);
});

const getTutorEmailAvailability = catchAsync(async (req, res) => {
  const result = await tutorService.getEmailAvailability(req.query.email);
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
  // Verify the caller is the admin identified by adminId (if provided)
  const { adminId, rejectionMessage, ...updateBody } = req.body;
  if (adminId && req.user && req.user.id !== adminId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to perform this action');
  }

  // Capture old status before saving for email decision
  const existingTutor = await tutorService.getTutorById(req.params.tutorId);
  if (!existingTutor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor not found');
  }
  const oldStatus = existingTutor.status;
  const newStatus = updateBody.status;

  const tutor = await tutorService.updateTutorById(req.params.tutorId, updateBody);

  // Fire status-change emails (fire-and-forget — never block the response)
  if (newStatus && newStatus !== oldStatus) {
    const fireEmail = async () => {
      try {
        if (newStatus === 'approved') {
          await emailService.sendTutorApprovedEmail(tutor.email, tutor.fullName);
        } else if (newStatus === 'rejected') {
          await emailService.sendTutorRejectedEmail(tutor.email, tutor.fullName, rejectionMessage || '');
        } else if (newStatus === 'suspended') {
          await emailService.sendTutorSuspendedEmail(tutor.email, tutor.fullName);
        }
      } catch (emailErr) {
        logger.warn(`Status email failed for tutor ${tutor.id} (${oldStatus} → ${newStatus}): ${emailErr.message}`);
      }
    };
    fireEmail();
  }

  res.send(tutor);
});

const deleteTutor = catchAsync(async (req, res) => {
  await tutorService.deleteTutorById(req.params.tutorId);
  res.status(httpStatus.NO_CONTENT).send();
});

const changePassword = catchAsync(async (req, res) => {
  const result = await tutorService.changePassword(req.params.tutorId, req.body);
  res.send(result);
});

const generateTempPassword = catchAsync(async (req, res) => {
  const result = await tutorService.generateTemporaryPassword(req.params.tutorId);
  res.send(result);
});

const matchTutorsBySubjects = catchAsync(async (req, res) => {
  const { subjects, tutorType } = req.body;
  const tutors = await tutorService.findTutorsBySubjects(subjects, tutorType);
  res.send({
    count: tutors.length,
    tutors,
  });
});

module.exports = {
  createTutor,
  getTutors,
  getTutorEmailAvailability,
  getTutor,
  updateTutor,
  deleteTutor,
  changePassword,
  generateTempPassword,
  matchTutorsBySubjects,
};
