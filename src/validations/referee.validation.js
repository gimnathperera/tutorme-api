const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReferee = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    contactNumber: Joi.string().required(),
    gender: Joi.string().required().valid('male', 'female'),
    avatar: Joi.string().allow('').optional(),
  }),
};

const getReferees = {
  query: Joi.object().keys({
    search: Joi.string().allow(''),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEmailAvailability = {
  query: Joi.object().keys({
    email: Joi.string().required().email(),
  }),
};

const updateReferee = {
  params: Joi.object().keys({
    refereeId: Joi.string().required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      email: Joi.string().email(),
      contactNumber: Joi.string(),
      gender: Joi.string().valid('male', 'female'),
      avatar: Joi.string().allow(''),
    })
    .min(1),
};

const deleteReferee = {
  params: Joi.object().keys({
    refereeId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createReferee,
  getReferees,
  getEmailAvailability,
  updateReferee,
  deleteReferee,
};
