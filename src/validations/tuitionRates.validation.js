const Joi = require('joi');
const mongoose = require('mongoose');

// Create tuition rate validation
const createTuitionRate = {
  body: Joi.object().keys({
    subject: Joi.string().required(),
    grade: Joi.string().required(),
    onlineIndividualTuitionRate: Joi.array().items(
      Joi.object().keys({
        minimumRate: Joi.string().required(),
        maximumRate: Joi.string().required(),
      })
    ),
    onlineGroupTuitionRate: Joi.array().items(
      Joi.object().keys({
        minimumRate: Joi.string().required(),
        maximumRate: Joi.string().required(),
      })
    ),
    physicalIndividualTuitionRate: Joi.array().items(
      Joi.object().keys({
        minimumRate: Joi.string().required(),
        maximumRate: Joi.string().required(),
      })
    ),
    physicalGroupTuitionRate: Joi.array().items(
      Joi.object().keys({
        minimumRate: Joi.string().required(),
        maximumRate: Joi.string().required(),
      })
    ),
  }),
};

// Get tuition rates validation (supports filtering)
const getTuitionRates = {
  query: Joi.object().keys({
    subject: Joi.string(),
    grade: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

// Get a single tuition rate validation
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

// Update tuition rates validation
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
      subject: Joi.string(),
      grade: Joi.string(),
      onlineIndividualTuitionRate: Joi.array().items(
        Joi.object().keys({
          minimumRate: Joi.string().required(),
          maximumRate: Joi.string().required(),
        })
      ),
      onlineGroupTuitionRate: Joi.array().items(
        Joi.object().keys({
          minimumRate: Joi.string().required(),
          maximumRate: Joi.string().required(),
        })
      ),
      physicalIndividualTuitionRate: Joi.array().items(
        Joi.object().keys({
          minimumRate: Joi.string().required(),
          maximumRate: Joi.string().required(),
        })
      ),
      physicalGroupTuitionRate: Joi.array().items(
        Joi.object().keys({
          minimumRate: Joi.string().required(),
          maximumRate: Joi.string().required(),
        })
      ),
    })
    .min(1),
};

// Delete tuition rates validation
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
