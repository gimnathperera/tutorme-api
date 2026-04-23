const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const adminAssignableRoles = ['tutor', 'admin'];
const adminUserStatuses = ['pending', 'approved', 'rejected', 'suspended'];

const createUser = {
  body: Joi.object()
    .keys({
      name: Joi.string().required(),
      email: Joi.string().required().email(),
      password: Joi.string().required().custom(password),
      role: Joi.string()
        .required()
        .valid(...adminAssignableRoles),
      phoneNumber: Joi.string().required(),
      status: Joi.string()
        .required()
        .valid(...adminUserStatuses),
    })
    .unknown(false),
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
      status: Joi.valid(...adminUserStatuses),
      country: Joi.string(),
      role: Joi.string().valid(...adminAssignableRoles),
      city: Joi.string(),
      state: Joi.string(),
      region: Joi.string(),
      zip: Joi.string(),
      address: Joi.string(),
      birthday: Joi.date(),
      gender: Joi.string(),
      avatar: Joi.string(),
    })
    .unknown(false)
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

const generateTempPassword = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
};

const createAdmin = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    phoneNumber: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  generateTempPassword,
  createAdmin,
};
