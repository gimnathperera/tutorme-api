const Joi = require('joi');
const mongoose = require('mongoose');

// Custom ObjectId validator
const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message('Invalid ID');
    }
    return value;
  });

/**
 * Create Tag
 */
const createTag = {
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(50),
    description: Joi.string().allow('', null),
  }),
};

/**
 * Get Tags (with optional query params)
 */
const getTags = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

/**
 * Get Tag by ID
 */
const getTag = {
  params: Joi.object().keys({
    tagId: objectId(),
  }),
};

/**
 * Update Tag
 */
const updateTag = {
  params: Joi.object().keys({
    tagId: objectId(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(2).max(50),
      description: Joi.string().allow('', null),
    })
    .min(1),
};

/**
 * Delete Tag
 */
const deleteTag = {
  params: Joi.object().keys({
    tagId: objectId(),
  }),
};

module.exports = {
  createTag,
  getTags,
  getTag,
  updateTag,
  deleteTag,
};
