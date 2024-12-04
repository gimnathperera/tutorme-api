const Joi = require('joi');
const mongoose = require('mongoose');

const createInquiry = {
  body: Joi.object().keys({
    message: Joi.string().required(),
    sender: Joi.object().keys({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
    }),
  }),
};

const getInquiries = {
  query: Joi.object().keys({
    message: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getInquiry = {
  params: Joi.object().keys({
    inquiryId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

const updateInquiry = {
  params: Joi.object().keys({
    inquiryId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      message: Joi.string(),
      sender: Joi.object().keys({
        name: Joi.string(),
        email: Joi.string().email(),
      }),
    })
    .min(1),
};

const deleteInquiry = {
  params: Joi.object().keys({
    inquiryId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid ID');
      }
      return value;
    }),
  }),
};

module.exports = {
  createInquiry,
  getInquiry,
  getInquiries,
  updateInquiry,
  deleteInquiry,
};
