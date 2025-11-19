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
    grade: Joi.array()
      .items(
        Joi.string().custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message('Invalid Grade ID');
          }
          return value;
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one grade must be selected',
      }),
    assignedTutor: Joi.array()
      .items(
        Joi.string().custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message('Invalid Tutor ID');
          }
          return value;
        })
      )
      .min(1),

    tutors: Joi.array()
      .items(
        Joi.object({
          subjects: Joi.array()
            .items(
              Joi.string().custom((value, helpers) => {
                if (!mongoose.Types.ObjectId.isValid(value)) {
                  return helpers.message('Invalid Subject ID');
                }
                return value;
              })
            )
            .min(1)
            .required()
            .messages({
              'array.min': 'Each tutor must have at least one subject',
            }),
          preferredTutorType: Joi.string()
            .valid('Part Time Tutors', 'Full Time Tutors', 'Ex / Current Government School Tutors')
            .required()
            .messages({
              'any.only': 'Preferred Tutor Type must be one of the allowed values',
              'any.required': 'Preferred Tutor Type is required',
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
  query: Joi.object().keys({}),
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
  body: Joi.object().keys({
    assignedTutor: Joi.array()
      .items(
        Joi.string().custom((value, helpers) => {
          if (!mongoose.Types.ObjectId.isValid(value)) {
            return helpers.message('Invalid Tutor ID');
          }
          return value;
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one tutor must be assigned',
      }),
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
