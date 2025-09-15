const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    role: Joi.string().required().valid('user', 'tutor', 'admin'),
    phoneNumber: Joi.string().required(),
    status: Joi.string().optional(),
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    region: Joi.string().optional(),
    zip: Joi.string().optional(),
    address: Joi.string().optional(),
    birthday: Joi.date().required(),
    tutorType: Joi.valid('part-time', 'full-time', 'gov').optional(),
    gender: Joi.string().optional(),
    duration: Joi.string().optional(),
    frequency: Joi.string().optional(),
    timeZone: Joi.string().optional(),
    language: Joi.string().optional(),
    avatar: Joi.string().optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      name: Joi.string(),
      phoneNumber: Joi.string(),
      status: Joi.valid('active', 'inactive', 'blocked'),
      country: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      region: Joi.string(),
      zip: Joi.string(),
      address: Joi.string(),
      birthday: Joi.date(),
      tutorType: Joi.valid('part-time', 'full-time', 'gov'),
      gender: Joi.string(),
      duration: Joi.string(),
      frequency: Joi.string(),
      grades: Joi.optional(),
      subjects: Joi.optional(),
      timeZone: Joi.string(),
      language: Joi.string(),
      avatar: Joi.string(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const changePassword = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      currentPassword: Joi.string().custom(password),
      newPassword: Joi.string().custom(password),
    })
    .min(1),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
};
