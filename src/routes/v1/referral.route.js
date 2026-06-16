const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const referralValidation = require('../../validations/referral.validation');
const referralController = require('../../controllers/referral.controller');

const router = express.Router();

// All referral management endpoints require admin authentication
router
  .route('/')
  .get(auth('manageUsers'), validate(referralValidation.getReferralsSummary), referralController.getReferralsSummary);

// Static route must come before parameterized route to avoid conflict
router
  .route('/rewards/batch')
  .patch(auth('manageUsers'), validate(referralValidation.batchUpdateRewards), referralController.batchUpdateRewards);

router
  .route('/:tutorId/rewards')
  .get(auth('manageUsers'), validate(referralValidation.getRewardsForReferrer), referralController.getRewardsForReferrer);

module.exports = router;
