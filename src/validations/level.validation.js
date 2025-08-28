const Joi = require('joi');
const mongoose = require('mongoose');

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID');
  }
  return value;
};

const createLevel = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    details: Joi.array().required(),
    challanges: Joi.array().required(),
    subjects: Joi.optional(),
  }),
};

const getLevels = {
  query: Joi.object().keys({
    title: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getLevel = {
  params: Joi.object().keys({
    levelId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateLevel = {
  params: Joi.object().keys({
    levelId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      description: Joi.string(),
      // Allow details & challanges as optional arrays of strings on update:
      details: Joi.array().items(Joi.string().trim()),
      challanges: Joi.array().items(Joi.string().trim()),
      // Subjects optional array of objectId strings:
      subjects: Joi.array().items(Joi.string().custom(objectId)),
    })
    .min(1),
};

const deleteLevel = {
  params: Joi.object().keys({
    levelId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createLevel,
  getLevel,
  getLevels,
  updateLevel,
  deleteLevel,
};
