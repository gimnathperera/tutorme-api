// title, tutortype, subject, grade, maximunRate, minimumRate
const Joi = require('joi');
const mongoose = require('mongoose');

const createTuitionRate = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    tutorType: Joi.valid('part-time', 'full-time', 'gov'),
    subject: Joi.required(),
    grade: Joi.required(),
    maximumRate: Joi.string().required(),
    minimumRate: Joi.string().required(),
  }),
};
const getTuitionRates = {
  query: Joi.object().keys({
    title: Joi.string(),
    subject: Joi.string(),
    grade: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};
const getTuitionRate = {
  params: Joi.object().keys({
    tuitionRatesId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateTuitionRates = {
  params: Joi.object().keys({
    tuitionRatesId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      minimumRate: Joi.optional(),
      maximumRate: Joi.optional(),
    })
    .min(1),
};
const deleteTuitionRates = {
  params: Joi.object().keys({
    tuitionRatesId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};
module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  deleteTuitionRates,
  updateTuitionRates,
};
