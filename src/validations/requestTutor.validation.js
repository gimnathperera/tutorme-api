const Joi = require('joi');
const mongoose = require('mongoose');

const createRequestTutor = {
  body: Joi.object().keys({
    // 🧍 Student Info
    firstName: Joi.string().trim().required().messages({
      'string.empty': 'First Name is required',
    }),
    lastName: Joi.string().trim().required().messages({
      'string.empty': 'Last Name is required',
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
    city: Joi.string().trim().required().messages({
      'string.empty': 'City is required',
    }),
    state: Joi.string().trim().required().messages({
      'string.empty': 'State is required',
    }),
    region: Joi.string().trim().required().messages({
      'string.empty': 'Region is required',
    }),
    zip: Joi.string().trim().required().messages({
      'string.empty': 'ZIP code is required',
    }),

    // 🎓 Grade (array of ObjectIds)
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

    // 📚 Tutors array (each with subjects, duration, frequency)
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

    // 🧑‍🏫 Preferred Tutor Type
    preferredTutorType: Joi.string()
      .valid('Part Time Tutors', 'Full Time Tutors', 'Ex / Current Government School Tutors')
      .required()
      .messages({
        'any.only': 'Preferred Tutor Type must be one of the allowed values',
        'any.required': 'Preferred Tutor Type is required',
      }),

    // 🏫 Student Details
    studentSchool: Joi.string().trim().required().messages({
      'string.empty': 'Student School is required',
    }),
    genderPreference: Joi.string().valid('Male', 'Female', 'Others').required().messages({
      'any.only': 'Gender Preference must be Male, Female, or Others',
      'any.required': 'Gender Preference is required',
    }),
    bilingual: Joi.string().valid('Yes', 'No').required().messages({
      'any.only': 'Bilingual must be Yes or No',
      'any.required': 'Bilingual field is required',
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

module.exports = {
  createRequestTutor,
  getTutors,
  getTutor,
  deleteTutor,
};
