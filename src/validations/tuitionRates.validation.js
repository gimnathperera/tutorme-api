const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createTuitionRate = {
  body: Joi.object().keys({
    tutorType: Joi.string().valid('university_student', 'graduate_teacher', 'gov_school_teacher').required(),
    gradeLevel: Joi.string().valid('grade_1_5', 'grade_6_9', 'o_level', 'a_level').required(),
    rateRange: Joi.object({
      min: Joi.number().positive().required(),
      max: Joi.number().positive().greater(Joi.ref('min')).required(),
    }).required(),
    currency: Joi.string().length(3).uppercase().default('LKR'),
  }),
};

const getTuitionRates = {
  query: Joi.object().keys({
    minRate: Joi.number().positive(),
    maxRate: Joi.number().positive(),
    currency: Joi.string().length(3).uppercase(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
};

const updateTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      ratePerHour: Joi.number().positive(),
      currency: Joi.string().length(3).uppercase(),
    })
    .min(1),
};

const deleteTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  updateTuitionRate,
  deleteTuitionRate,
};
