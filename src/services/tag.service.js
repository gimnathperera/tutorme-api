const httpStatus = require('http-status');
const { Tag } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a Tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  return Tag.create(tagBody);
};

/**
 * Query for Tags
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryTags = async (filter, options) => {
  const tags = await Tag.paginate(filter, options);
  return tags;
};

/**
 * Get Tag by ID
 * @param {ObjectId} id
 * @returns {Promise<Tag>}
 */
const getTagById = async (id) => {
  return Tag.findById(id);
};

/**
 * Update Tag by ID
 * @param {ObjectId} tagId
 * @param {Object} updateBody
 * @returns {Promise<Tag>}
 */
const updateTagById = async (tagId, updateBody) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  Object.assign(tag, updateBody);
  await tag.save();
  return tag;
};

/**
 * Delete Tag by ID
 * @param {ObjectId} tagId
 * @returns {Promise<Tag>}
 */
const deleteTagById = async (tagId) => {
  const tag = await getTagById(tagId);
  if (!tag) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Tag not found');
  }
  await tag.remove();
  return tag;
};

module.exports = {
  createTag,
  queryTags,
  getTagById,
  updateTagById,
  deleteTagById,
};
