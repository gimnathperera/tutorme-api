const httpStatus = require('http-status');
const { Paper } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a paper
 * @param {Object} paperBody
 * @returns {Promise<Paper>}
 */
const createPaper = async (paperBody) => {
  return Paper.create(paperBody);
};

/**
 * Query for papers
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryPapers = async (filter, options) => {
  const papers = await Paper.paginate(filter, options);
  return papers;
};

/**
 * Get paper by id
 * @param {ObjectId} id
 * @returns {Promise<Paper>}
 */
const getPaperById = async (id) => {
  return Paper.findById(id).populate('subjects').populate('grade').populate('subject');
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

  Object.assign(paper, updateBody);
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
  getPaperById,
  updatePaperById,
  deletePaperById,
};
