const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const bonusTransactionSchema = new mongoose.Schema(
  {
    referrerModel: { type: String, enum: ['Tutor', 'User', 'Referee'], default: 'Tutor' },
    referrerTutorId: { type: mongoose.Schema.Types.ObjectId, refPath: 'referrerModel', required: true, index: true },
    referrerName: { type: String, required: true, trim: true },
    referrerEmail: { type: String, required: true, trim: true, lowercase: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminEmail: { type: String, required: true, trim: true, lowercase: true },
    rewardIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReferralReward' }],
    rewardCount: { type: Number, required: true, min: 1 },
    slip: {
      data: { type: String, default: null },
      fileName: { type: String, default: null },
      mimeType: { type: String, default: null },
    },
  },
  { timestamps: true }
);

bonusTransactionSchema.plugin(toJSON);

module.exports = mongoose.model('BonusTransaction', bonusTransactionSchema);
