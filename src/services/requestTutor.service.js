const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { RequestTutor, Tutor, Grade, Subject } = require('../models');
const ApiError = require('../utils/ApiError');
const emailService = require('./email.service');
const logger = require('../config/logger');
const config = require('../config/config');

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

const formatAvailabilitySlot = (slot) => `${slot.day}: ${slot.start} - ${slot.end}`;

const resolveGradeDoc = async (gradeValue) => {
  if (!gradeValue) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(gradeValue)) {
    const byId = await Grade.findById(gradeValue).select('title').lean();
    if (byId) {
      return byId;
    }
  }

  return Grade.findOne({ title: gradeValue }).select('title').lean();
};

const resolveSubjectDoc = async (subjectValue) => {
  if (!subjectValue) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(subjectValue)) {
    const byId = await Subject.findById(subjectValue).select('title').lean();
    if (byId) {
      return byId;
    }
  }

  return Subject.findOne({ title: subjectValue }).select('title').lean();
};

const buildTutorMatchQuery = (gradeDoc, subjectDoc, requestTutor, tutorBlock) => {
  const query = {
    status: 'approved',
  };

  if (gradeDoc) {
    query.grades = gradeDoc._id;
  }

  if (requestTutor.medium) {
    query.tutorMediums = requestTutor.medium;
  }

  if (subjectDoc) {
    query.subjects = subjectDoc._id;
  }

  if (tutorBlock.preferredTutorType) {
    query.tutorType = tutorBlock.preferredTutorType;
  }

  if (tutorBlock.preferredClassType) {
    query.classType = tutorBlock.preferredClassType;
  }

  return query;
};

const buildTutorSummary = (tutor) => {
  const availability = Array.isArray(tutor.availability) ? tutor.availability : [];

  return {
    id: tutor._id,
    fullName: tutor.fullName,
    contactNumber: tutor.contactNumber,
    email: tutor.email,
    tutorType: tutor.tutorType || [],
    tutorMediums: tutor.tutorMediums || [],
    preferredLocations: tutor.preferredLocations || [],
    yearsExperience: tutor.yearsExperience,
    highestEducation: tutor.highestEducation,
    academicDetails: tutor.academicDetails || '',
    teachingSummary: tutor.teachingSummary || '',
    studentResults: tutor.studentResults || '',
    sellingPoints: tutor.sellingPoints || '',
    language: tutor.language || '',
    timeZone: tutor.timeZone || '',
    rate: tutor.rate || '',
    subjects: Array.isArray(tutor.subjects) ? tutor.subjects.map((subject) => subject.title || subject) : [],
    grades: Array.isArray(tutor.grades) ? tutor.grades.map((grade) => grade.title || grade) : [],
    availability: availability.map(formatAvailabilitySlot),
    availabilityCount: availability.length,
  };
};

async function serializeRequestTutorWithGradeName(requestTutorDoc) {
  if (!requestTutorDoc) {
    return null;
  }

  const requestTutorJson = requestTutorDoc.toJSON ? requestTutorDoc.toJSON() : { ...requestTutorDoc };
  const gradeDoc = await resolveGradeDoc(requestTutorJson.grade);

  return {
    ...requestTutorJson,
    grade: gradeDoc ? gradeDoc.title : requestTutorJson.grade,
  };
}

const buildTutorRequestMatchReport = async (requestTutor) => {
  const [gradeDoc, blockSubjectDocs] = await Promise.all([
    resolveGradeDoc(requestTutor.grade),
    Promise.all(
      (requestTutor.tutors || []).map(async (tutorBlock) => {
        const subjectDoc = await resolveSubjectDoc(tutorBlock.subject);
        return {
          tutorBlock,
          subjectTitle: subjectDoc ? subjectDoc.title : tutorBlock.subject || 'N/A',
          subjectDoc,
        };
      })
    ),
  ]);

  const gradeTitle = gradeDoc ? gradeDoc.title : requestTutor.grade || 'N/A';

  const blocks = await Promise.all(
    blockSubjectDocs.map(async ({ tutorBlock, subjectTitle, subjectDoc }) => {
      const tutors = await Tutor.find(buildTutorMatchQuery(gradeDoc, subjectDoc, requestTutor, tutorBlock))
        .populate('grades', 'title')
        .populate('subjects', 'title')
        .select(
          'fullName contactNumber email tutorType tutorMediums preferredLocations yearsExperience highestEducation academicDetails teachingSummary studentResults sellingPoints language timeZone rate availability grades subjects'
        )
        .lean();

      const matchedTutors = tutors
        .map((tutor) => buildTutorSummary(tutor))
        .sort((left, right) => {
          if (right.availabilityCount !== left.availabilityCount) {
            return right.availabilityCount - left.availabilityCount;
          }

          return (right.yearsExperience || 0) - (left.yearsExperience || 0);
        });

      return {
        subject: subjectTitle,
        preferredTutorType: tutorBlock.preferredTutorType,
        preferredClassType: tutorBlock.preferredClassType,
        duration: tutorBlock.duration,
        frequency: tutorBlock.frequency,
        matchedTutors,
      };
    })
  );

  const adminEmail = config.email.admin;
  const requestSummary = {
    name: requestTutor.name,
    email: requestTutor.email,
    phoneNumber: requestTutor.phoneNumber,
    city: requestTutor.city,
    district: requestTutor.district,
    medium: requestTutor.medium,
    grade: gradeTitle,
    status: requestTutor.status,
  };
  const escapeHtml = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const escapeMultiline = (value) => escapeHtml(value).replace(/\n/g, '<br/>').replace(/\r/g, '');

  const formatArrayCell = (values) => {
    const items = Array.isArray(values) ? values : [];
    return items.length ? items.map((item) => escapeHtml(item)).join('<br/>') : 'N/A';
  };

  const tutorRow = (tutor, index) => `
    <tr>
      <td>
        <div class="tutor-name">${index + 1}. ${escapeHtml(tutor.fullName)}</div>
        <div class="muted">${escapeHtml(tutor.rate || 'N/A')}</div>
      </td>
      <td>${escapeHtml(tutor.contactNumber || 'N/A')}</td>
      <td>${escapeHtml(tutor.email || 'N/A')}</td>
      <td>${formatArrayCell(tutor.tutorType)}</td>
      <td>${formatArrayCell(tutor.tutorMediums)}</td>
      <td>${escapeHtml(tutor.highestEducation || 'N/A')}</td>
      <td>${escapeHtml(tutor.yearsExperience)}</td>
      <td>${formatArrayCell(tutor.preferredLocations)}</td>
      <td>${formatArrayCell(tutor.grades)}</td>
      <td>${formatArrayCell(tutor.subjects)}</td>
      <td>${formatArrayCell(tutor.availability)}</td>
      <td>${escapeMultiline(tutor.academicDetails || 'N/A')}</td>
      <td>${escapeMultiline(tutor.teachingSummary || 'N/A')}</td>
      <td>${escapeMultiline(tutor.studentResults || 'N/A')}</td>
      <td>${escapeMultiline(tutor.sellingPoints || 'N/A')}</td>
      <td>${escapeHtml(tutor.language || 'N/A')}</td>
      <td>${escapeHtml(tutor.timeZone || 'N/A')}</td>
    </tr>
  `;

  const blockSection = (block, index) => `
    <section class="block-card">
      <div class="block-header">
        <div>
          <div class="eyebrow">Request Block ${index + 1}</div>
          <h2>${escapeHtml(block.subject)}</h2>
        </div>
        <div class="pill">${block.matchedTutors.length} matched tutor(s)</div>
      </div>
      <div class="grid compact">
        <div><span class="label">Preferred Tutor Type</span><div>${escapeHtml(block.preferredTutorType)}</div></div>
        <div><span class="label">Preferred Class Type</span><div>${escapeHtml(block.preferredClassType)}</div></div>
        <div><span class="label">Duration</span><div>${escapeHtml(block.duration)}</div></div>
        <div><span class="label">Frequency</span><div>${escapeHtml(block.frequency)}</div></div>
      </div>
      ${
        block.matchedTutors.length
          ? `
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tutor</th>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Tutor Type</th>
                    <th>Mediums</th>
                    <th>Highest Education</th>
                    <th>Experience</th>
                    <th>Locations</th>
                    <th>Grades</th>
                    <th>Subjects</th>
                    <th>Availability</th>
                    <th>Academic Details</th>
                    <th>Teaching Summary</th>
                    <th>Student Results</th>
                    <th>Selling Points</th>
                    <th>Language</th>
                    <th>Time Zone</th>
                  </tr>
                </thead>
                <tbody>
                  ${block.matchedTutors.map((tutor, tutorIndex) => tutorRow(tutor, tutorIndex)).join('')}
                </tbody>
              </table>
            </div>
          `
          : '<div class="empty-state">No tutors matched this block.</div>'
      }
    </section>
  `;

  const html = `
    <div style="background:#f5f7fb;padding:32px 0;font-family:Arial,sans-serif;color:#111827;">
      <style>
        .report-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
        .report-card { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
        .report-header { background: linear-gradient(135deg,#111827,#334155); color: #fff; padding: 28px 32px; }
        .report-header h1 { margin: 8px 0 0; font-size: 28px; line-height: 1.2; }
        .report-body { padding: 28px 32px; background: #fff; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 16px; margin-bottom: 28px; }
        .block-card { border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-top: 20px; background: #fafafa; }
        .block-header { display:flex; justify-content:space-between; align-items:flex-start; gap: 16px; margin-bottom: 16px; }
        .eyebrow { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #6b7280; }
        .pill { background: #111827; color: #fff; border-radius: 999px; padding: 8px 12px; font-size: 12px; white-space: nowrap; }
        .grid.compact { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 12px; margin-bottom: 16px; }
        .label { display:block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: #6b7280; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 12px; }
        .empty-state { padding: 16px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; color: #9a3412; }
        .table-wrap { overflow-x: auto; margin-top: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; }
        table { width: 100%; border-collapse: collapse; min-width: 1500px; }
        thead th { background: #f8fafc; position: sticky; top: 0; z-index: 1; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 12px 14px; vertical-align: top; text-align: left; font-size: 13px; line-height: 1.5; }
        th { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: #475569; }
        tbody tr:nth-child(even) { background: #fcfcfd; }
        .tutor-name { font-weight: 700; color: #111827; }
      </style>
      <div class="report-shell">
        <div class="report-card">
          <div class="report-header">
            <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">Tutor Request Match Report</div>
            <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(requestSummary.name)}</h1>
            <p style="margin:10px 0 0;opacity:.85;">Automatically matched tutors based on request criteria and tutor profile availability.</p>
          </div>
          <div class="report-body">
            <div class="summary-grid">
              <div><div class="label">Request ID</div><div>${escapeHtml(requestTutor.id || requestTutor._id)}</div></div>
              <div><div class="label">Requester Email</div><div>${escapeHtml(requestSummary.email)}</div></div>
              <div><div class="label">Phone</div><div>${escapeHtml(requestSummary.phoneNumber)}</div></div>
              <div><div class="label">Location</div><div>${escapeHtml(
                `${requestSummary.city}, ${requestSummary.district}`
              )}</div></div>
              <div><div class="label">Medium</div><div>${escapeHtml(requestSummary.medium)}</div></div>
              <div><div class="label">Grade</div><div>${escapeHtml(requestSummary.grade)}</div></div>
            </div>

            ${blocks.map((block, index) => blockSection(block, index)).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    'Tutor Request Match Report',
    `Request ID: ${requestTutor.id || requestTutor._id}`,
    `Requester: ${requestSummary.name}`,
    `Email: ${requestSummary.email}`,
    `Phone: ${requestSummary.phoneNumber}`,
    `Location: ${requestSummary.city}, ${requestSummary.district}`,
    `Medium: ${requestSummary.medium}`,
    `Grade: ${requestSummary.grade}`,
    `Status: ${requestSummary.status}`,
  ].join('\n');

  return {
    adminEmail,
    requestSummary,
    blocks,
    text,
    html,
  };
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

  const results = await Promise.all(
    requestTutors.results.map((requestTutorDoc) => serializeRequestTutorWithGradeName(requestTutorDoc))
  );

  return {
    ...requestTutors,
    results,
  };
};

/**
 * Get tutor request by id
 */
const getRequestTutorById = async (id) => {
  return RequestTutor.findById(id);
};

const getRequestTutorByIdWithGradeName = async (id) => {
  const requestTutorDoc = await RequestTutor.findById(id);
  return serializeRequestTutorWithGradeName(requestTutorDoc);
};

const sendTutorMatchReportToAdmin = async (requestTutorId) => {
  const requestTutorDoc = await getRequestTutorById(requestTutorId);

  if (!requestTutorDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  const report = await buildTutorRequestMatchReport(requestTutorDoc);
  const subject = `Tutor Request Match Report - ${report.requestSummary.name}`;

  await emailService.sendEmail(report.adminEmail, subject, report.text, report.html);

  return {
    message: 'Tutor request match report sent to admin',
    adminEmail: report.adminEmail,
    requestTutorId: requestTutorDoc.id,
    matchedBlocks: report.blocks.map((block) => ({
      subject: block.subject,
      matchedTutors: block.matchedTutors.length,
    })),
  };
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
 * Unassign tutor(s) from specific blocks within a request.
 * Reverts overall status to Pending if all blocks become unassigned.
 * Fires an email to the requester with the reason (non-blocking).
 */
const unassignTutor = async (requestTutorId, tutorBlockIds, unassignReason) => {
  const tutorRequest = await getRequestTutorById(requestTutorId);
  if (!tutorRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tutor request not found');
  }

  // Capture block details before clearing so the email has accurate info
  const blocksToNotify = await Promise.all(
    tutorBlockIds.map(async (blockId) => {
      const block = tutorRequest.tutors.id(blockId);
      if (!block) return null;

      const [subjectDoc, tutorDoc] = await Promise.all([
        resolveSubjectDoc(block.subject),
        block.assignedTutor ? Tutor.findById(block.assignedTutor).select('fullName').lean() : null,
      ]);

      return {
        subjectName: subjectDoc ? subjectDoc.title : block.subject || 'N/A',
        tutorName: tutorDoc ? tutorDoc.fullName : 'N/A',
      };
    })
  ).then((results) => results.filter(Boolean));

  tutorBlockIds.forEach((blockId) => {
    const block = tutorRequest.tutors.id(blockId);
    if (block) {
      block.assignedTutor = null;
    }
  });

  const allUnassigned = tutorRequest.tutors.every((block) => !block.assignedTutor);
  if (allUnassigned) {
    tutorRequest.status = 'Pending';
  }

  await tutorRequest.save();

  // Fire email non-blocking
  emailService.sendTutorUnassignedToRequester(tutorRequest, blocksToNotify, unassignReason).catch((err) => {
    logger.warn(`Unassign email failed for request ${requestTutorId}: ${err.message}`);
  });

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

  if (status === 'Rejected' && previousStatus !== 'Rejected') {
    tutorRequest.rejectionReason = rejectionReason;
  } else if (status !== 'Rejected') {
    tutorRequest.rejectionReason = '';
  }

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
  getRequestTutorByIdWithGradeName,
  deleteTutorRequestById,
  updateStatusById,
  updateAssignedTutor,
  unassignTutor,
  sendTutorMatchReportToAdmin,
};
