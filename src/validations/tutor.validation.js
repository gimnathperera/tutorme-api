const Joi = require('joi');
const mongoose = require('mongoose');

const createTutor = {
  body: Joi.object().keys({
    status: Joi.string().optional(),
    personalInfo: Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
      phoneNumber: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zip: Joi.string().required(),
      region: Joi.string().required(),
      grade: Joi.string().required(),
    }),
    lessonInfo: Joi.object().keys({
      tutorCount: Joi.string().required(),
      lessonDetails: Joi.array()
        .items(
          Joi.object().keys({
            subjects: Joi.array().items(Joi.string()).required(),
            duration: Joi.string().required(),
            frequency: Joi.string().required(),
          })
        )
        .required(),
    }),
    tutorTypeInfo: Joi.object().keys({
      tutorType: Joi.string().required(),
      studentSchool: Joi.string().required(),
      genderPreference: Joi.string().required(),
      isBilingualTutor: Joi.boolean().required(),
    }),
  }),
};

const getTutors = {
  query: Joi.object().keys({
    name: Joi.string(),
    subject: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      subject: Joi.string(),
      experience: Joi.number().integer(),
    })
    .min(1),
};

const deleteTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createTutor,
  getTutors,
  getTutor,
  updateTutor,
  deleteTutor,
};
