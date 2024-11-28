const Joi = require('joi');
const mongoose = require('mongoose');

const createGrade = {
  body: Joi.object().keys({
    title: Joi.string().required(),
  }),
};

const getGrades = {
  query: Joi.object().keys({
    title: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
    })
    .min(1),
};

const deleteGrade = {
  params: Joi.object().keys({
    gradeId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
};
