const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { ReferralReward } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Get a paginated summary of referrers with total and pending reward counts.
 */
const getReferralsSummary = async (options = {}) => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $group: {
        _id: '$referrerTutorId',
        totalReferrals: { $sum: 1 },
        pendingRewards: { $sum: { $cond: [{ $eq: ['$rewardSent', false] }, 1, 0] } },
      },
    },
    { $sort: { totalReferrals: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: 'tutors',
        localField: '_id',
        foreignField: '_id',
        as: 'referrer',
      },
    },
    { $unwind: '$referrer' },
    {
      $project: {
        _id: 0,
        referrerTutorId: '$_id',
        referrerName: '$referrer.fullName',
        referrerEmail: '$referrer.email',
        referralCode: '$referrer.referralCode',
        totalReferrals: 1,
        pendingRewards: 1,
      },
    },
  ];

  const countPipeline = [{ $group: { _id: '$referrerTutorId' } }, { $count: 'total' }];

  const [results, countResult] = await Promise.all([
    ReferralReward.aggregate(pipeline),
    ReferralReward.aggregate(countPipeline),
  ]);

  const totalResults = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalResults / limit) || 1;

  return { results, page, limit, totalResults, totalPages };
};

/**
 * Get all reward entries for a specific referrer tutor.
 * @param {string} referrerTutorId
 * @param {boolean} [unsentOnly=true]
 */
const getRewardsForReferrer = async (referrerTutorId, unsentOnly = true) => {
  if (!mongoose.Types.ObjectId.isValid(referrerTutorId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tutor ID');
  }

  const filter = { referrerTutorId };
  if (unsentOnly) filter.rewardSent = false;

  const rewards = await ReferralReward.find(filter)
    .populate('referredTutorId', 'fullName email createdAt')
    .sort({ createdAt: -1 })
    .lean();

  return rewards.map((r) => ({
    ...r,
    id: r._id.toString(),
    referredTutorId: r.referredTutorId ? { ...r.referredTutorId, id: r.referredTutorId._id?.toString() } : r.referredTutorId,
  }));
};

/**
 * Batch-update rewardSent for multiple reward entries.
 * @param {Array<{id: string, rewardSent: boolean}>} updates
 */
const batchUpdateRewards = async (updates) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No updates provided');
  }

  const ops = updates.map(({ id, rewardSent }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { rewardSent: Boolean(rewardSent) } },
    },
  }));

  await ReferralReward.bulkWrite(ops);
};

module.exports = {
  getReferralsSummary,
  getRewardsForReferrer,
  batchUpdateRewards,
};
