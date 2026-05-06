const httpStatus = require('http-status');
const { RequestTutor, Tutor, Grade, Subject } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const logger = require('../config/logger');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toArray = (value) => (Array.isArray(value) ? value : [value]);
const normalizeValues = (value) =>
  toArray(value)
    .map((item) => String(item).trim())
    .filter(Boolean);

const buildExactMatch = (value) => ({
  $regex: `^${escapeRegex(String(value).trim())}$`,
  $options: 'i',
});

const buildContainsMatch = (value) => ({
  $regex: escapeRegex(String(value).trim()),
  $options: 'i',
});

const buildScalarFilter = (value, { contains = false } = {}) => {
  if (Array.isArray(value)) {
    return { $in: normalizeValues(value) };
  }

  return contains ? buildContainsMatch(value) : buildExactMatch(value);
};

const buildTutorRequestQuery = (filter = {}) => {
  const query = { ...filter };
  const searchTerm = typeof query.search === 'string' ? query.search.trim() : '';

  delete query.search;

  if (query.name) {
    query.name = buildScalarFilter(query.name, { contains: true });
  }

  if (query.email) {
    query.email = buildScalarFilter(query.email);
  }

  if (query.phoneNumber) {
    query.phoneNumber = buildScalarFilter(query.phoneNumber, { contains: true });
  }

  if (query.city) {
    query.city = buildScalarFilter(query.city);
  }

  if (query.district) {
    query.district = buildScalarFilter(query.district);
  }

  if (query.grade) {
    query.grade = buildScalarFilter(query.grade);
  }

  if (query.medium) {
    query.medium = buildScalarFilter(query.medium);
  }

  if (query.status) {
    query.status = buildScalarFilter(query.status);
  }

  const tutorBlockFilters = {};

  if (query.subject) {
    tutorBlockFilters.subject = buildScalarFilter(query.subject, { contains: true });
    delete query.subject;
  }

  if (query.assignedTutor) {
    tutorBlockFilters.assignedTutor = buildScalarFilter(query.assignedTutor, { contains: true });
    delete query.assignedTutor;
  }

  if (query.preferredTutorType) {
    tutorBlockFilters.preferredTutorType = Array.isArray(query.preferredTutorType)
      ? { $in: toArray(query.preferredTutorType).map((value) => String(value).trim()) }
      : buildExactMatch(query.preferredTutorType);
    delete query.preferredTutorType;
  }

  if (query.preferredClassType) {
    tutorBlockFilters.preferredClassType = Array.isArray(query.preferredClassType)
      ? { $in: toArray(query.preferredClassType).map((value) => String(value).trim()) }
      : buildExactMatch(query.preferredClassType);
    delete query.preferredClassType;
  }

  if (query.duration) {
    tutorBlockFilters.duration = Array.isArray(query.duration)
      ? { $in: toArray(query.duration).map((value) => String(value).trim()) }
      : buildExactMatch(query.duration);
    delete query.duration;
  }

  if (query.frequency) {
    tutorBlockFilters.frequency = Array.isArray(query.frequency)
      ? { $in: toArray(query.frequency).map((value) => String(value).trim()) }
      : buildExactMatch(query.frequency);
    delete query.frequency;
  }

  if (Object.keys(tutorBlockFilters).length > 0) {
    query.tutors = { $elemMatch: tutorBlockFilters };
  }

  if (searchTerm) {
    const searchRegex = buildContainsMatch(searchTerm);
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
      { city: searchRegex },
      { district: searchRegex },
    ];
  }

  return query;
};

const sendAcknowledgement = async (requestTutorBody) => {
  try {
    await emailService.sendAcknowledgement(requestTutorBody);
  } catch (err) {
    logger.error({ err }, 'Failed to send acknowledgement email');
  }
};

const sendAssignmentEmails = async (tutorRequest, assignedBlock) => {
  try {
    const [tutorDoc, gradeDoc, subjectDoc] = await Promise.all([
      Tutor.findById(assignedBlock.assignedTutor)
        .select(
          'fullName email contactNumber tutorType highestEducation yearsExperience teachingSummary academicDetails studentResults sellingPoints'
        )
        .lean(),
      Grade.findById(tutorRequest.grade).select('title').lean(),
      Subject.findById(assignedBlock.subject).select('title').lean(),
    ]);

    const gradeName = gradeDoc ? gradeDoc.title : 'N/A';
    const subjectName = subjectDoc ? subjectDoc.title : 'N/A';
    const tutorUser = tutorDoc ? { name: tutorDoc.fullName, email: tutorDoc.email } : null;

    await Promise.all([
      emailService.sendTutorAssignedToRequester(tutorRequest, assignedBlock, subjectName, gradeName, tutorDoc),
      tutorUser
        ? emailService.sendTutorAssignedToTutor(tutorUser, tutorRequest, assignedBlock, subjectName, gradeName)
        : Promise.resolve(),
    ]);
  } catch (err) {
    logger.error({ err }, 'Failed to send assignment emails');
  }
};

/**
 * Request a Tutor
 */
const requestTutor = async (requestTutorBody) => {
  logger.info({ requestTutorBody }, 'Tutor request created');

  const tutorCreateResponse = await RequestTutor.create({
    ...requestTutorBody,
    status: 'Pending',
  });
  if (tutorCreateResponse) {
    sendAcknowledgement(requestTutorBody);
  }
  return tutorCreateResponse;
};

/**
 * Query for tutor requests
 */
const queryTutorsRequests = async (filter, options) => {
  const requestTutors = await RequestTutor.paginate(buildTutorRequestQuery(filter), {
    ...options,
  });
  return requestTutors;
};

/**
 * Get tutor request by id
 */
const getRequestTutorById = async (id) => {
  return RequestTutor.findById(id);
};

/**
 * Delete tutor request
 */
const deleteTutorRequestById = async (requestTutorId) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }
  await tutorRequest.remove();
  return tutorRequest;
};

/**
 * Update ONLY the status
 */
const updateStatusById = async (requestTutorId, status, rejectionReason) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  const previousStatus = tutorRequest.status;
  tutorRequest.status = status;
  await tutorRequest.save();

  if (status === 'Rejected' && previousStatus !== 'Rejected') {
    try {
      await emailService.sendRequestTutorRejectedEmail(tutorRequest.email, tutorRequest.name, rejectionReason, tutorRequest);
    } catch (err) {
      logger.error({ err }, 'Failed to send tutor request rejection email');
    }
  }

  return tutorRequest;
};

/**
 * Update the assignedTutor for tutor block(s) within a request.
 * - assignedTutor as array: maps positionally to tutor blocks (index 0 → block 0, etc.)
 * - assignedTutor as string + tutorBlockId: targets that specific sub-document
 * - assignedTutor as string only: defaults to the first tutor block
 */
const updateAssignedTutor = async (requestTutorId, assignedTutor, tutorBlockId) => {
  logger.info(
    `updateAssignedTutor called: requestTutorId=${requestTutorId}, tutorBlockId=${tutorBlockId}, assignedTutor=${assignedTutor}`
  );

  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  const blocksToNotify = [];

  if (Array.isArray(assignedTutor)) {
    assignedTutor.forEach((tutorId, index) => {
      if (tutorRequest.tutors[index]) {
        tutorRequest.tutors[index].assignedTutor = tutorId;
        blocksToNotify.push({ ...tutorRequest.tutors[index].toObject(), assignedTutor: tutorId });
      }
    });
  } else if (tutorBlockId) {
    const tutorBlock = tutorRequest.tutors.id(tutorBlockId);
    if (!tutorBlock) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Tutor block not found');
    }
    tutorBlock.assignedTutor = assignedTutor;
    blocksToNotify.push({ ...tutorBlock.toObject(), assignedTutor });
  } else {
    const tutorBlock = tutorRequest.tutors[0];
    if (!tutorBlock) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No tutor blocks found in this request');
    }
    tutorBlock.assignedTutor = assignedTutor;
    blocksToNotify.push({ ...tutorBlock.toObject(), assignedTutor });
  }

  await tutorRequest.save();

  logger.info(`blocksToNotify count: ${blocksToNotify.length}`);

  // Send emails non-blocking — one email pair per assigned block
  blocksToNotify.forEach((block) => sendAssignmentEmails(tutorRequest, block));

  return tutorRequest;
};

module.exports = {
  requestTutor,
  queryTutorsRequests,
  getRequestTutorById,
  deleteTutorRequestById,
  updateStatusById,
  updateAssignedTutor,
};
