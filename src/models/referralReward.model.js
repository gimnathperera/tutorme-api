const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const referralRewardSchema = mongoose.Schema(
  {
    referrerModel: {
      type: String,
      enum: ['Tutor', 'User', 'Referee'],
      default: 'Tutor',
    },
    referrerTutorId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'referrerModel',
      required: true,
      index: true,
    },
    referredTutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },
    rewardSent: {
      type: Boolean,
      default: false,
    },
    lockedInBatch: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

referralRewardSchema.plugin(toJSON);
referralRewardSchema.plugin(paginate);

const ReferralReward = mongoose.model('ReferralReward', referralRewardSchema);

module.exports = ReferralReward;
