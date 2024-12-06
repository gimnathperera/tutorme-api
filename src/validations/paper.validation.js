const Joi = require('joi');
const mongoose = require('mongoose');

const createPaper = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    description: Joi.string().required(),
    subject: Joi.string().required(),
    grade: Joi.string().required(),
    year: Joi.string().required(),
    url: Joi.string().required(),
  }),
};

const getPapers = {
  query: Joi.object().keys({
    title: Joi.string(),
    grade: Joi.string(),
    subject: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getPaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updatePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom((value, helpers) => {
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
      subject: Joi.string(),
      grade: Joi.string(),
      year: Joi.string(),
      url: Joi.string(),
    })
    .min(1),
};

const deletePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createPaper,
  getPapers,
  getPaper,
  updatePaper,
  deletePaper,
};
