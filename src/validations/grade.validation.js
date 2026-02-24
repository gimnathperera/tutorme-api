const Joi = require('joi');
const mongoose = require('mongoose');

const createGrade = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    subjects: Joi.optional(),
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

const getSubjectsForGrades = {
  body: Joi.object().keys({
    gradeIds: Joi.array()
      .items(
        Joi.string().custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message('Invalid grade id');
          }
          return value;
        })
      )
      .min(1)
      .required(),
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
      description: Joi.string(),
      subjects: Joi.optional(),
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
  getSubjectsForGrades,
  updateGrade,
  deleteGrade,
};
