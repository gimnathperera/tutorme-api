const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { referralService, referralCodeService, bonusTransactionService } = require('../services');
const pick = require('../utils/pick');
const logger = require('../config/logger');

const validateReferralCode = catchAsync(async (req, res) => {
  const { code } = req.query;
  const referrer = await referralCodeService.findReferrerByReferralCode(code);
  // Return only valid/invalid — no sensitive data exposed
  res.send({ valid: Boolean(referrer) });
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
  const { updates, referrerTutorId } = req.body;
  await referralService.batchUpdateRewards(updates);

  // Create a bonus transaction for every reward being marked as sent
  const sentRewardIds = updates.filter((u) => u.rewardSent === true).map((u) => u.id);
  if (sentRewardIds.length > 0 && referrerTutorId) {
    try {
      await bonusTransactionService.createTransaction({
        referrerTutorId,
        adminId: req.user.id,
        adminEmail: req.user.email,
        rewardIds: sentRewardIds,
        rewardCount: sentRewardIds.length,
      });
    } catch (err) {
      // Non-fatal — log but don't block the reward update response
      logger.warn(`Failed to create bonus transaction: ${err.message}`);
    }
  }

  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  validateReferralCode,
  getReferralsSummary,
  getRewardsForReferrer,
  batchUpdateRewards,
};
