const httpStatus = require('http-status');
const { Grade, Paper, Subject } = require('../models');
const ApiError = require('../utils/ApiError');
const { formatPaperMediums, normalizePaperMedium, paperMediums, normalizeExamType } = require('../config/paper');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeMediumOrThrow = (medium) => {
  const normalizedMedium = normalizePaperMedium(medium);

  if (!normalizedMedium) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid medium');
  }

  return normalizedMedium;
};

const preparePaperData = (paperBody) => {
  const paperData = { ...paperBody };

  if (paperData.medium !== undefined) {
    paperData.medium = normalizeMediumOrThrow(paperData.medium);
  }

  if (paperData.examType) {
    paperData.examType = normalizeExamType(paperData.examType) || paperData.examType;
  }

  return paperData;
};

const preparePaperQuery = (filter) => {
  const query = { ...filter };
  const yearSearch = typeof query.yearSearch === 'string' ? query.yearSearch.trim() : '';
  const { fromYear, toYear } = query;

  delete query.yearSearch;
  delete query.fromYear;
  delete query.toYear;

  if (fromYear !== undefined || toYear !== undefined) {
    query.year = {};
    if (fromYear !== undefined) query.year.$gte = fromYear;
    if (toYear !== undefined) query.year.$lte = toYear;
  }

  if (query.examType !== undefined) {
    const examTypeValue = query.examType;
    delete query.examType;
    const examTypeConditions = [
      { examType: { $regex: `^${escapeRegex(examTypeValue)}$`, $options: 'i' } },
      { title: { $regex: escapeRegex(examTypeValue), $options: 'i' } },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: examTypeConditions }];
      delete query.$or;
    } else {
      query.$or = examTypeConditions;
    }
  }

  if (query.medium !== undefined) {
    const normalizedMedium = normalizeMediumOrThrow(query.medium);
    query.medium = { $regex: `^${escapeRegex(normalizedMedium)}$`, $options: 'i' };
  }

  if (query.title !== undefined) {
    query.title = { $regex: escapeRegex(query.title), $options: 'i' };
  }

  if (yearSearch) {
    query.$expr = {
      $regexMatch: {
        input: { $toString: '$year' },
        regex: escapeRegex(yearSearch),
      },
    };
  }

  return query;
};

const validatePaperReferences = async (paperBody) => {
  if (paperBody.grade) {
    const gradeExists = await Grade.exists({ _id: paperBody.grade });
    if (!gradeExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid grade');
    }
  }

  if (paperBody.subject) {
    const subjectExists = await Subject.exists({ _id: paperBody.subject });
    if (!subjectExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid subject');
    }
  }
};

const resolveSubjectTitle = async (subjectId) => {
  if (!subjectId) return null;
  const subject = await Subject.findById(subjectId).select('title').lean();
  return subject ? subject.title : null;
};

/**
 * Create a paper
 * @param {Object} paperBody
 * @returns {Promise<Paper>}
 */
const createPaper = async (paperBody) => {
  if (paperBody.medium === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Medium is required');
  }

  const paperData = preparePaperData(paperBody);
  await validatePaperReferences(paperData);
  paperData.subjectTitle = await resolveSubjectTitle(paperData.subject);
  return Paper.create(paperData);
};

/**
 * Query for papers
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryPapers = async (filter, options) => {
  const query = preparePaperQuery(filter);
  const papers = await Paper.paginate(query, options);
  return papers;
};

const getConfiguredPaperMediums = () => paperMediums;

const getPaperMediums = async (filter) => {
  const query = preparePaperQuery(filter);
  const mediums = await Paper.distinct('medium', query);
  return formatPaperMediums(mediums);
};

/**
 * Get paper by id
 * @param {ObjectId} id
 * @returns {Promise<Paper>}
 */
const getPaperById = async (id) => {
  return Paper.findById(id).populate('grade').populate('subject');
};

/**
 * Update paper by id
 * @param {ObjectId} paperId
 * @param {Object} updateBody
 * @returns {Promise<Paper>}
 */
const updatePaperById = async (paperId, updateBody) => {
  const paper = await getPaperById(paperId);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }

  const paperData = preparePaperData(updateBody);
  await validatePaperReferences(paperData);

  if (paperData.subject) {
    paperData.subjectTitle = await resolveSubjectTitle(paperData.subject);
  }

  Object.assign(paper, paperData);
  await paper.save();
  return paper;
};

/**
 * Delete paper by id
 * @param {ObjectId} paperId
 * @returns {Promise<Paper>}
 */
const deletePaperById = async (paperId) => {
  const paper = await getPaperById(paperId);
  if (!paper) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Paper not found');
  }
  await paper.remove();
  return paper;
};

module.exports = {
  createPaper,
  queryPapers,
  getConfiguredPaperMediums,
  getPaperMediums,
  getPaperById,
  updatePaperById,
  deletePaperById,
};
