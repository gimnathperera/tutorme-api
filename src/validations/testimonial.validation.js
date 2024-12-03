const Joi = require('joi');
const mongoose = require('mongoose');

const createTestimonials = {
  body: Joi.object().keys({
    content: Joi.string().required(),
    rating: Joi.string().required(),
    owner: Joi.object().keys({
      name: Joi.string().required(),
      role: Joi.string().required(),
      avatar: Joi.string(),
    }),
  }),
};

const getTestimonials = {
  query: Joi.object().keys({
    title: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getTestimonial = {
  params: Joi.object().keys({
    testimonialId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateTestimonials = {
  params: Joi.object().keys({
    testimonialId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      content: Joi.string(),
      rating: Joi.string(),
      owner: Joi.object().keys({
        name: Joi.string(),
        role: Joi.string(),
        avatar: Joi.string(),
      }),
    })
    .min(1),
};

const deleteTestimonials = {
  params: Joi.object().keys({
    testimonialId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createTestimonials,
  getTestimonial,
  getTestimonials,
  updateTestimonials,
  deleteTestimonials,
};
