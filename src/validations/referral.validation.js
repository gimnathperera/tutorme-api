const Joi = require('joi');
const { objectId } = require('./custom.validation');

const validateReferralCode = {
  query: Joi.object().keys({
    code: Joi.string().alphanum().max(20).required(),
  }),
};

const getReferralsSummary = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};

const getRewardsForReferrer = {
  params: Joi.object().keys({
    tutorId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    unsentOnly: Joi.string().valid('true', 'false').optional(),
  }),
};

const batchUpdateRewards = {
  body: Joi.object().keys({
    updates: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().custom(objectId),
          rewardSent: Joi.boolean().required(),
        })
      )
      .min(5)
      .required(),
    referrerTutorId: Joi.string().custom(objectId).optional(),
  }),
};

module.exports = {
  validateReferralCode,
  getReferralsSummary,
  getRewardsForReferrer,
  batchUpdateRewards,
};
