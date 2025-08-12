// Import Joi for schema validation
const Joi = require('joi');
// Import custom objectId validator
const { objectId } = require('./custom.validation');

/**
 * Validation schema for creating a new tuition rate
 */
const createTuitionRate = {
  body: Joi.object().keys({
    tutorType: Joi.string().valid('university_student', 'graduate_teacher', 'gov_school_teacher').required(),
    gradeLevel: Joi.string()
      .valid(
        'grade_1',
        'grade_2',
        'grade_3',
        'grade_4',
        'grade_5',
        'grade_6',
        'grade_7',
        'grade_8',
        'grade_9',
        'grade_10',
        'grade_11',
        'grade_12',
        'grade_1_5',
        'grade_6_9',
        'o_level',
        'a_level'
      )
      .required(),
    // Rate range must include min and max, both positive numbers
    // Max must be greater than min
    rateRange: Joi.object({
      min: Joi.number().positive().required(),
      max: Joi.number().positive().greater(Joi.ref('min')).required(),
    }).required(),
    currency: Joi.string().default('Rs.'),
  }),
};

/**
 * Validation schema for fetching multiple tuition rates
 * Supports filtering, sorting, and pagination
 */
const getTuitionRates = {
  query: Joi.object().keys({
    tutorType: Joi.string().valid('university_student', 'graduate_teacher', 'gov_school_teacher'),
    gradeLevel: Joi.string().valid(
      'grade_1',
      'grade_2',
      'grade_3',
      'grade_4',
      'grade_5',
      'grade_6',
      'grade_7',
      'grade_8',
      'grade_9',
      'grade_10',
      'grade_11',
      'grade_12',
      'grade_1_5',
      'grade_6_9',
      'o_level',
      'a_level'
    ),
    minRate: Joi.number().positive(),
    maxRate: Joi.number().positive(),
    currency: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

/**
 * Validation schema for fetching a single tuition rate by ID
 */
const getTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
};

/**
 * Validation schema for updating a tuition rate
 */
const updateTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      tutorType: Joi.string().valid('university_student', 'graduate_teacher', 'gov_school_teacher'),
      gradeLevel: Joi.string().valid(
        'grade_1',
        'grade_2',
        'grade_3',
        'grade_4',
        'grade_5',
        'grade_6',
        'grade_7',
        'grade_8',
        'grade_9',
        'grade_10',
        'grade_11',
        'grade_12',
        'grade_1_5',
        'grade_6_9',
        'o_level',
        'a_level'
      ),
      rateRange: Joi.object({
        min: Joi.number().positive().required(),
        max: Joi.number().positive().greater(Joi.ref('min')).required(),
      }),
      currency: Joi.string(),
    })
    .min(1),
};

/**
 * Validation schema for deleting a tuition rate by ID
 */
const deleteTuitionRate = {
  params: Joi.object().keys({
    tuitionRateId: Joi.string().custom(objectId),
  }),
};

// Export all validation schemas
module.exports = {
  createTuitionRate,
  getTuitionRates,
  getTuitionRate,
  updateTuitionRate,
  deleteTuitionRate,
};
