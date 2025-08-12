const httpStatus = require('http-status');
const { Level } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a level
 * @param {Object} levelBody
 * @returns {Promise<Level>}
 */
const createLevel = async (levelBody) => {
  if (await Level.isTitleTaken(levelBody.title)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title already taken');
  }
  return Level.create(levelBody);
};

/**
 * Query for levels
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryLevels = async (filter, options) => {
  const levels = await Level.paginate(filter, options);
  return levels;
};

/**
 * Get level by id
 * @param {ObjectId} id
 * @returns {Promise<Level>}
 */
const getLevelById = async (id) => {
  return Level.findById(id).populate('subjects');
};

/**
 * Update level by id
 * @param {ObjectId} levelId
 * @param {Object} updateBody
 * @returns {Promise<Level>}
 */
const updateLevelById = async (levelId, updateBody) => {
  const level = await getLevelById(levelId);
  if (!level) {
    throw new ApiError(httpStatus.NOT_FOUND, 'level not found');
  }
  if (updateBody.title && (await Level.isTitleTaken(updateBody.title, levelId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Title already taken');
  }
  Object.assign(level, updateBody);
  await level.save();
  return level;
};

/**
 * Delete level by id
 * @param {ObjectId} levelId
 * @returns {Promise<Level>}
 */
const deleteLevelById = async (levelId) => {
  const level = await getLevelById(levelId);
  if (!level) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Level not found');
  }
  await level.remove();
  return level;
};

module.exports = {
  createLevel,
  queryLevels,
  getLevelById,
  updateLevelById,
  deleteLevelById,
};
