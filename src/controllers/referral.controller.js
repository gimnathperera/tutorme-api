const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { referralService, tutorService } = require('../services');
const pick = require('../utils/pick');

const validateReferralCode = catchAsync(async (req, res) => {
  const { code } = req.query;
  const tutor = await tutorService.findTutorByReferralCode(code);
  // Return only valid/invalid — no sensitive data exposed
  res.send({ valid: Boolean(tutor) });
});

const getReferralsSummary = catchAsync(async (req, res) => {
  const options = pick(req.query, ['page', 'limit']);
  const result = await referralService.getReferralsSummary(options);
  res.send(result);
});

const getRewardsForReferrer = catchAsync(async (req, res) => {
  const { tutorId } = req.params;
  const unsentOnly = req.query.unsentOnly !== 'false';
  const rewards = await referralService.getRewardsForReferrer(tutorId, unsentOnly);
  res.send({ results: rewards });
});

const batchUpdateRewards = catchAsync(async (req, res) => {
  await referralService.batchUpdateRewards(req.body.updates);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  validateReferralCode,
  getReferralsSummary,
  getRewardsForReferrer,
  batchUpdateRewards,
};
