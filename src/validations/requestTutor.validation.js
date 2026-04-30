const Joi = require('joi');
const mongoose = require('mongoose');

const createRequestTutor = {
  body: Joi.object().keys({
    name: Joi.string().trim().required().messages({
      'string.empty': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required',
    }),
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
    }),
    district: Joi.string().trim().required().messages({
      'string.empty': 'District is required',
    }),
    phoneNumber: Joi.string()
      .pattern(/^[0-9]{7,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Phone number must be digits only (7–15 characters)',
        'string.empty': 'Phone Number is required',
      }),
    medium: Joi.string().valid('Sinhala', 'Tamil', 'English').required().messages({
      'any.only': 'Medium must be one of the allowed values',
      'any.required': 'Medium is required',
    }),
    status: Joi.string().valid('Pending', 'Approved', 'Tutor Assigned').required().messages({
      'any.only': 'Status must be one of the allowed values',
      'any.required': 'Status is required',
    }),
    grade: Joi.string().trim().required().messages({
      'string.empty': 'Grade is required',
      'any.required': 'Grade is required',
    }),

    tutors: Joi.array()
      .items(
        Joi.object({
          subject: Joi.string().trim().required().messages({
            'string.empty': 'Subject is required',
            'any.required': 'Subject is required',
          }),
          assignedTutor: Joi.string().trim().allow('', null).optional(),
          preferredTutorType: Joi.string()
            .valid(
              'Private Tutor',
              'Government Teacher',
              'University Student',
              'Coach',
              'International School Teacher',
              'University Lecturer',
              'Full-Time',
              'Part-Time',
              'Online',
              'School Teacher Tutors',
              'Group Tutors',
              'Exam Coaches',
              'Advanced Level',
              'Diploma Holders',
              'Ex-MOE (Ministry of Education)',
              'Part-time Tutors',
              'Full-time Tutors'
            )
            .required()
            .messages({
              'any.only': 'Preferred Tutor Type must be one of the allowed values',
              'any.required': 'Preferred Tutor Type is required',
            }),
          preferredClassType: Joi.string()
            .valid('Online - Individual', 'Online - Group', 'Physical - Individual', 'Physical - Group')
            .required()
            .messages({
              'any.only': 'Preferred Class Type must be one of the allowed values',
              'any.required': 'Preferred Class Type is required',
            }),
          duration: Joi.string().valid('30 Minutes', 'One Hour', 'Two Hours').required().messages({
            'any.only': 'Duration must be 30 Minutes, One Hour, or Two Hours',
            'any.required': 'Duration is required',
          }),
          frequency: Joi.string().valid('Once a Week', 'Twice a Week', 'Daily').required().messages({
            'any.only': 'Frequency must be Once a Week, Twice a Week, or Daily',
            'any.required': 'Frequency is required',
          }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one tutor entry is required',
      }),
  }),
};

const getTutors = {
  query: Joi.object().keys({
    name: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTutor = {
  params: Joi.object().keys({
    requestTutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const deleteTutor = {
  params: Joi.object().keys({
    requestTutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const updateStatus = {
  body: Joi.object().keys({
    status: Joi.string().valid('Pending', 'Approved', 'Tutor Assigned').required().messages({
      'any.only': 'Status must be one of the allowed values',
      'any.required': 'Status is required',
    }),
  }),
};

const updateAssignedTutor = {
  params: Joi.object().keys({
    requestTutorId: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid request tutor ID');
        }
        return value;
      })
      .required(),
  }),
  body: Joi.object().keys({
    assignedTutor: Joi.alternatives()
      .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
      .required()
      .messages({
        'alternatives.match': 'assignedTutor must be a string or an array of strings',
        'any.required': 'Assigned Tutor is required',
      }),
    tutorBlockId: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.message('Invalid tutor block ID');
        }
        return value;
      })
      .optional(),
  }),
};

module.exports = {
  createRequestTutor,
  getTutors,
  getTutor,
  deleteTutor,
  updateStatus,
  updateAssignedTutor,
};
