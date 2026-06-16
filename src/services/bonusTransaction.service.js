const httpStatus = require('http-status');
const { BonusTransaction, Tutor, User, Referee } = require('../models');
const ApiError = require('../utils/ApiError');

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
 * Attach a slip (base64) to an existing transaction.
 */
const uploadSlip = async (id, { data, fileName, mimeType }) => {
  const transaction = await BonusTransaction.findById(id);
  if (!transaction) throw new ApiError(httpStatus.NOT_FOUND, 'Transaction not found');
  transaction.slip = { data, fileName, mimeType };
  await transaction.save();
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
