const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { normalizePaperMedium } = require('../config/paper');

const paperMedium = (value, helpers) => {
  const normalizedMedium = normalizePaperMedium(value);

  if (!normalizedMedium) {
    return helpers.message('"{{#label}}" must be a valid paper medium');
  }

  return normalizedMedium;
};

const createPaper = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    medium: Joi.string().required().custom(paperMedium),
    subject: Joi.string().required().custom(objectId),
    grade: Joi.string().required().custom(objectId),
    year: Joi.number().required(),
    url: Joi.string().required(),
  }),
};

const getPapers = {
  query: Joi.object().keys({
    title: Joi.string(),
    grade: Joi.string().custom(objectId),
    subject: Joi.string().custom(objectId),
    medium: Joi.string().custom(paperMedium),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

const getPaperMediums = {
  query: Joi.object().keys({
    grade: Joi.string().custom(objectId),
    subject: Joi.string().custom(objectId),
  }),
};

const getPaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId),
  }),
};

const updatePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      medium: Joi.string().custom(paperMedium),
      subject: Joi.string().custom(objectId),
      grade: Joi.string().custom(objectId),
      year: Joi.number(),
      url: Joi.string(),
    })
    .min(1),
};

const deletePaper = {
  params: Joi.object().keys({
    paperId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createPaper,
  getPapers,
  getPaperMediums,
  getPaper,
  updatePaper,
  deletePaper,
};
