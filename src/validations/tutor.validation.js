const Joi = require('joi');
const mongoose = require('mongoose');
const { password, objectId } = require('./custom.validation');
const { parseAvailabilityInput } = require('../utils/availability');
const {
  tutorTypes,
  genders,
  nationalities,
  races,
  tutorStatuses,
  classTypes,
  classTypesExtended,
  tutoringLevels,
  preferredLocations,
  tutorMediums,
  highestEducationLevels,
  highestEducationLevelsExtended,
} = require('../config/enums');

const availabilityField = Joi.alternatives()
  .try(
    Joi.string(),
    Joi.array().items(
      Joi.object({
        day: Joi.string().required(),
        start: Joi.string().required(),
        end: Joi.string().required(),
      })
    )
  )
  .custom((value, helpers) => {
    try {
      return parseAvailabilityInput(value);
    } catch (error) {
      return helpers.message(error.message);
    }
  }, 'availability normalization');

const createTutor = {
  body: Joi.object().keys({
    // 1. Personal Information
    fullName: Joi.string().required().messages({
      'string.empty': 'Full Name is required',
    }),
    contactNumber: Joi.string().pattern(/^\d+$/).min(7).max(15).required().messages({
      'string.pattern.base': 'Contact Number must be digits only',
      'string.empty': 'Contact Number is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be valid',
      'string.empty': 'Email is required',
    }),
    password: Joi.string().custom(password).required().messages({
      'string.empty': 'Password is required',
    }),
    dateOfBirth: Joi.string().isoDate().required().messages({
      'string.isoDate': 'Date of Birth must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Date of Birth is required',
    }),
    gender: Joi.string()
      .valid(...genders)
      .required()
      .messages({
        'any.only': 'Gender must be Male or Female',
        'any.required': 'Gender is required',
      }),
    age: Joi.number().integer().min(1).required().messages({
      'number.base': 'Age must be a number',
      'any.required': 'Age is required',
    }),
    nationality: Joi.string()
      .valid(...nationalities)
      .required(),
    race: Joi.string()
      .valid(...races)
      .required(),

    // 2. Tutoring Preferences
    classType: Joi.array()
      .items(Joi.string().valid(...classTypes))
      .min(1)
      .required(),
    tutoringLevels: Joi.array()
      .items(Joi.string().valid(...tutoringLevels))
      .optional(),
    preferredLocations: Joi.array()
      .items(Joi.string().valid(...preferredLocations))
      .min(1)
      .required(),

    // 3. Academic Qualifications & Experience
    tutorMediums: Joi.array()
      .items(Joi.string().valid(...tutorMediums))
      .min(1)
      .required()
      .messages({
        'array.min': 'Please select at least one medium.',
      }),
    grades: Joi.array().items(Joi.string()).min(1).required(),
    subjects: Joi.array().items(Joi.string()).min(1).required(),
    tutorType: Joi.array()
      .items(Joi.string().valid(...tutorTypes))
      .min(1)
      .required(),
    yearsExperience: Joi.number().integer().min(0).max(50).required(),
    highestEducation: Joi.string()
      .valid(...highestEducationLevels)
      .required(),
    academicDetails: Joi.string().allow('').max(1000),

    // 4. Tutor's Profile
    teachingSummary: Joi.string().max(750).required(),
    studentResults: Joi.string().max(750).required(),
    sellingPoints: Joi.string().max(750).required(),
    certificatesAndQualifications: Joi.array()
      .items(
        Joi.object().keys({
          type: Joi.string().required(),
          url: Joi.string().trim().min(1).required(),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'Certificates and qualifications must be an array',
        'array.min': 'At least one certificate or qualification is required',
      }),

    // 5. Agreement & Submit
    agreeTerms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must agree to Terms and Conditions',
    }),
    agreeAssignmentInfo: Joi.boolean().valid(true).required(),
  }),
};

const getTutors = {
  query: Joi.object().keys({
    search: Joi.string().allow(''),
    status: Joi.string().valid(...tutorStatuses),
    tutorType: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    preferredLocations: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())),
    gradeId: Joi.string().custom(objectId).optional(),
    subjectId: Joi.string().custom(objectId).optional(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTutorEmailAvailability = {
  query: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const getTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const updateTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      // Admin identifier for role verification
      adminId: Joi.string().optional(),

      // 0. Status (admin-only)
      status: Joi.string()
        .valid(...tutorStatuses)
        .optional(),

      // Custom rejection message (used when status is 'rejected')
      rejectionMessage: Joi.string().allow('').max(1000).optional(),

      // 1. Personal Information
      fullName: Joi.string(),
      contactNumber: Joi.string().pattern(/^\d+$/).min(7).max(15),
      email: Joi.string().email(),
      dateOfBirth: Joi.string().isoDate(),
      gender: Joi.string().valid(...genders),
      age: Joi.number().integer().min(1),
      nationality: Joi.string().valid(...nationalities),
      race: Joi.string().valid(...races),

      tutorMediums: Joi.array()
        .items(Joi.string().valid(...tutorMediums))
        .min(1),
      grades: Joi.array().items(Joi.string()),
      subjects: Joi.array().items(Joi.string()),

      // 2. Tutoring Preferences
      classType: Joi.array().items(Joi.string().valid(...classTypesExtended)),
      tutoringLevels: Joi.array().items(Joi.string().valid(...tutoringLevels)),

      preferredLocations: Joi.array().items(Joi.string().valid(...preferredLocations)),

      // 3. Academic Qualifications & Experience
      tutorType: Joi.array()
        .items(Joi.string().valid(...tutorTypes))
        .optional(),
      yearsExperience: Joi.number().integer().min(0).max(50),
      highestEducation: Joi.string().valid(...highestEducationLevelsExtended),
      academicDetails: Joi.string().allow('').max(1000),

      // 4. Tutor's Profile
      teachingSummary: Joi.string().max(750),
      studentResults: Joi.string().max(750),
      sellingPoints: Joi.string().max(750),
      certificatesAndQualifications: Joi.array().items(
        Joi.object().keys({
          id: Joi.string().optional(),
          type: Joi.string().required(),
          url: Joi.string().trim().min(1).required(),
        })
      ),
      language: Joi.string(),
      timeZone: Joi.string(),
      rate: Joi.string(),
      availability: availabilityField,

      // 5. Agreement
      agreeTerms: Joi.boolean(),
      agreeAssignmentInfo: Joi.boolean(),
    })
    .min(1),
};

const deleteTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const changePassword = {
  params: Joi.object().keys({
    tutorId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      currentPassword: Joi.string().custom(password),
      newPassword: Joi.string().custom(password),
    })
    .min(1),
};

const generateTempPassword = {
  params: Joi.object().keys({
    tutorId: Joi.string().required().custom(objectId),
  }),
};

const matchTutorsBySubjects = {
  body: Joi.object().keys({
    subjects: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),

    tutorType: Joi.string().optional(),
  }),
};

const tutorUserProfileFields = {
  age: Joi.number().integer().min(0).max(120),
  nationality: updateTutor.body.extract('nationality'),
  race: updateTutor.body.extract('race'),
  tutoringLevels: updateTutor.body.extract('tutoringLevels'),
  preferredLocations: updateTutor.body.extract('preferredLocations'),
  tutorMediums: updateTutor.body.extract('tutorMediums'),
  tutorType: updateTutor.body.extract('tutorType'),
  highestEducation: Joi.string().valid(...highestEducationLevels),
  yearsExperience: updateTutor.body.extract('yearsExperience'),
  academicDetails: Joi.string().allow('').max(500),
  certificatesAndQualifications: Joi.array().items(Joi.string()),
  language: Joi.string(),
  timeZone: Joi.string(),
  rate: Joi.string(),
  availability: availabilityField,
};

module.exports = {
  createTutor,
  getTutors,
  getTutorEmailAvailability,
  getTutor,
  updateTutor,
  deleteTutor,
  changePassword,
  generateTempPassword,
  matchTutorsBySubjects,
  tutorUserProfileFields,
};
