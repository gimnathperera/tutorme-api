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
    // Resolve the referred tutor's status so we can filter pendingRewards correctly.
    // totalReferrals counts every ReferralReward doc (all statuses).
    // pendingRewards counts only unsent rewards where the referred tutor is 'approved'.
    {
      $lookup: {
        from: 'tutors',
        localField: 'referredTutorId',
        foreignField: '_id',
        as: 'referredTutor',
      },
    },
    {
      $addFields: {
        referredTutorStatus: { $ifNull: [{ $arrayElemAt: ['$referredTutor.status', 0] }, null] },
      },
    },
    {
      $group: {
        _id: '$referrerTutorId',
        totalReferrals: { $sum: 1 },
        pendingRewards: {
          $sum: {
            $cond: {
              if: {
                $and: [{ $eq: ['$rewardSent', false] }, { $eq: ['$referredTutorStatus', 'approved'] }],
              },
              then: 1,
              else: 0,
            },
          },
        },
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
        as: 'tutorReferrer',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userReferrer',
      },
    },
    {
      $lookup: {
        from: 'referees',
        localField: '_id',
        foreignField: '_id',
        as: 'refereeReferrer',
      },
    },
    {
      $addFields: {
        referrer: {
          $ifNull: [
            { $arrayElemAt: ['$tutorReferrer', 0] },
            { $ifNull: [{ $arrayElemAt: ['$userReferrer', 0] }, { $arrayElemAt: ['$refereeReferrer', 0] }] },
          ],
        },
        referrerType: {
          $cond: [
            { $gt: [{ $size: '$tutorReferrer' }, 0] },
            'tutor',
            { $cond: [{ $gt: [{ $size: '$userReferrer' }, 0] }, 'admin', 'referee'] },
          ],
        },
      },
    },
    { $match: { referrer: { $ne: null } } },
    {
      $project: {
        _id: 0,
        referrerTutorId: '$_id',
        referrerType: 1,
        referrerName: { $ifNull: ['$referrer.fullName', '$referrer.name'] },
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
 * - At least 5 rewards must be marked as sent in one batch.
 * - Once a reward is locked (lockedInBatch: true) it cannot be un-sent.
 * @param {Array<{id: string, rewardSent: boolean}>} updates
 */
const batchUpdateRewards = async (updates) => {
  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No updates provided');
  }

  const toBeSent = updates.filter((u) => u.rewardSent === true);
  if (toBeSent.length < 5) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `A reward batch requires at least 5 referrals. You selected ${toBeSent.length}.`
    );
  }

  const ops = updates.map(({ id, rewardSent }) => {
    if (rewardSent) {
      // Mark as sent and lock permanently — filter excludes already-locked docs
      // so re-saving the same item is a harmless no-op.
      return {
        updateOne: {
          filter: { _id: id },
          update: { $set: { rewardSent: true, lockedInBatch: true } },
        },
      };
    }
    // Un-sending is only allowed for items that have NOT been locked yet.
    return {
      updateOne: {
        filter: { _id: id, lockedInBatch: { $ne: true } },
        update: { $set: { rewardSent: false } },
      },
    };
  });

  await ReferralReward.bulkWrite(ops);
};

module.exports = {
  getReferralsSummary,
  getRewardsForReferrer,
  batchUpdateRewards,
};
