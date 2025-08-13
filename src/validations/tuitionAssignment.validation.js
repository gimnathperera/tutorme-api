const Joi = require('joi');
const mongoose = require('mongoose');

const createTuitionAssignment = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    assignmentNumber: Joi.string().required(),
    address: Joi.string().required(),
    duration: Joi.string().required(),
    gradeId: Joi.string().required(),
    tutorId: Joi.string().required(),
    assignmentPrice: Joi.string().required(),
  }),
};

const getTuitionAssignments = {
  query: Joi.object().keys({
    title: Joi.string(),
    assignmentNumber: Joi.string(),
    gradeId: Joi.string(),
    tutorId: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTuitionAssignment = {
  params: Joi.object().keys({
    tuitionAssignmentId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateTuitionAssignment = {
  params: Joi.object().keys({
    tuitionAssignmentId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      assignmentNumber: Joi.string(),
      address: Joi.string(),
      duration: Joi.string(),
      gradeId: Joi.string(),
      tutorId: Joi.string(),
      assignmentPrice: Joi.string(),
    })
    .min(1),
};

const deleteTuitionAssignment = {
  params: Joi.object().keys({
    tuitionAssignmentId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createTuitionAssignment,
  getTuitionAssignments,
  getTuitionAssignment,
  updateTuitionAssignment,
  deleteTuitionAssignment,
};
