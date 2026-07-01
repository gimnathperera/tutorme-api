const Joi = require('joi');
const { objectId, base64FileSize } = require('./custom.validation');

// Must match the AddSlipModal MAX_MB limit advertised to admins in tutor-me-admin.
const MAX_SLIP_BYTES = 1 * 1024 * 1024;

const getTransactions = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

const getTransactionById = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

const uploadSlip = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
  body: Joi.object().keys({
    data: Joi.string().required().custom(base64FileSize(MAX_SLIP_BYTES)),
    fileName: Joi.string().required(),
    mimeType: Joi.string().valid('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf').required(),
  }),
};

const getSlip = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
  }),
};

module.exports = { getTransactions, getTransactionById, uploadSlip, getSlip };
