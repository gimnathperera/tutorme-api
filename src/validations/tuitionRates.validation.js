const Joi = require('joi');
const mongoose = require('mongoose');

const rateRange = Joi.object().keys({
  minimumRate: Joi.number().positive().required(),
  maximumRate: Joi.number().positive().required(),
});

const idValidator = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message('Invalid ID');
  }
  return value;
});

// Create tuition rate validation
const createTuitionRate = {
  body: Joi.object().keys({
    subject: Joi.string().required(),
    grade: Joi.string().required(),
    universityStudentsRate: rateRange.required(),
    partTimeTutorRate: rateRange.required(),
    fullTimeTutorRate: rateRange.required(),
    moeTeacherRate: rateRange.required(),
  }),
};

// Get tuition rates validation
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
    tuitionRatesId: idValidator,
  }),
};

// Update tuition rates validation
const updateTuitionRates = {
  params: Joi.object().keys({
    tuitionRatesId: idValidator,
  }),
  body: Joi.object()
    .keys({
      subject: Joi.string(),
      grade: Joi.string(),
      universityStudentsRate: rateRange,
      partTimeTutorRate: rateRange,
      fullTimeTutorRate: rateRange,
      moeTeacherRate: rateRange,
    })
    .min(1),
};

// Delete tuition rates validation
const deleteTuitionRates = {
  params: Joi.object().keys({
    tuitionRatesId: idValidator,
  }),
};

module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  deleteTuitionRates,
  updateTuitionRates,
};
