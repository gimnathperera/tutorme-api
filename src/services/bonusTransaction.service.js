const httpStatus = require('http-status');
const { BonusTransaction, Tutor, User, Referee, ReferralReward } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const emailService = require('./email.service');

/**
 * Create a bonus transaction record when rewards are marked as sent.
 * The referrer may be a tutor, an admin user, or a referee.
 */
const createTransaction = async ({ referrerTutorId, adminId, adminEmail, rewardIds, rewardCount }) => {
  const tutor = await Tutor.findById(referrerTutorId).select('fullName email').lean();
  if (tutor) {
    return BonusTransaction.create({
      referrerTutorId,
      referrerModel: 'Tutor',
      referrerName: tutor.fullName,
      referrerEmail: tutor.email,
      adminId,
      adminEmail,
      rewardIds,
      rewardCount,
    });
  }

  const referrerUser = await User.findById(referrerTutorId).select('name email').lean();
  if (referrerUser) {
    return BonusTransaction.create({
      referrerTutorId,
      referrerModel: 'User',
      referrerName: referrerUser.name,
      referrerEmail: referrerUser.email,
      adminId,
      adminEmail,
      rewardIds,
      rewardCount,
    });
  }

  const referrerReferee = await Referee.findById(referrerTutorId).select('name email').lean();
  if (!referrerReferee) throw new ApiError(httpStatus.NOT_FOUND, 'Referrer not found');

  return BonusTransaction.create({
    referrerTutorId,
    referrerModel: 'Referee',
    referrerName: referrerReferee.name,
    referrerEmail: referrerReferee.email,
    adminId,
    adminEmail,
    rewardIds,
    rewardCount,
  });
};

/**
 * Get paginated list of bonus transactions.
 */
const getTransactions = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [results, totalResults] = await Promise.all([
    BonusTransaction.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-slip.data') // exclude heavy base64 from list view
      .lean(),
    BonusTransaction.countDocuments(),
  ]);

  return {
    results: results.map((t) => ({ ...t, id: t._id.toString(), hasSlip: Boolean(t.slip && t.slip.fileName) })),
    page,
    limit,
    totalResults,
    totalPages: Math.ceil(totalResults / limit) || 1,
  };
};

/**
 * Get a single transaction with full details (populated rewards).
 */
const getTransactionById = async (id) => {
  const transaction = await BonusTransaction.findById(id)
    .populate({
      path: 'rewardIds',
      select: 'rewardSent createdAt',
      populate: { path: 'referredTutorId', select: 'fullName email' },
    })
    .lean();
  if (!transaction) throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  return { ...transaction, id: transaction._id.toString(), hasSlip: Boolean(transaction.slip && transaction.slip.fileName) };
};

/**
 * Attach a slip (base64) to an existing transaction, then fire a payment
 * confirmation email to the referee. Email is fire-and-forget — a send
 * failure is logged but never blocks or rolls back the slip save.
 */
const uploadSlip = async (id, { data, fileName, mimeType }) => {
  const transaction = await BonusTransaction.findById(id);
  if (!transaction) throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  transaction.slip = { data, fileName, mimeType };
  await transaction.save();

  // Fire-and-forget — not awaited so the HTTP 204 response is not delayed
  const fireConfirmationEmail = async () => {
    try {
      // Compute referral breakdown for this referee reusing the same
      // ReferralReward + tutors join pattern from getReferralsSummary.
      const [breakdown] = await ReferralReward.aggregate([
        { $match: { referrerTutorId: transaction.referrerTutorId } },
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
            _id: null,
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$referredTutorStatus', 'approved'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$referredTutorStatus', 'rejected'] }, 1, 0] } },
          },
        },
      ]);

      const counts = breakdown || { total: 0, approved: 0, rejected: 0 };

      await emailService.sendPaymentConfirmationEmail(transaction.referrerEmail, transaction.referrerName, counts, {
        data,
        fileName,
        mimeType,
      });

      logger.info(`Payment confirmation email sent to ${transaction.referrerEmail} for transaction ${id}`);
    } catch (err) {
      logger.warn(
        `Failed to send payment confirmation email for transaction ${id} to ${transaction.referrerEmail}: ${err.message}`
      );
    }
  };

  fireConfirmationEmail();
};

/**
 * Get only the slip data for a transaction.
 */
const getSlip = async (id) => {
  const transaction = await BonusTransaction.findById(id).select('slip').lean();
  if (!transaction) throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  if (!transaction.slip || !transaction.slip.data)
    throw new ApiError(httpStatus.NOT_FOUND, 'No slip uploaded for this transaction');
  return transaction.slip;
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  uploadSlip,
  getSlip,
};
