const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { tutorTypes } = require('../config/users');

const tuitionRatesSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    tutorType: {
      type: String,
      enum: [tutorTypes.FULL_TIME, tutorTypes.PART_TIME, tutorTypes.GOV],
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
    },
    level: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Level',
    },
    maximumRate: {
      type: String,
      required: true,
    },
    minimumRate: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tuitionRatesSchema.plugin(toJSON);
tuitionRatesSchema.plugin(paginate);

/**
 * Check if title is taken
 * @param {string} title - The tuition rate's title
 * @param {ObjectId} [excludedTuitionRateId] - The id of the tuition rate to be excluded
 * @returns {Promise<boolean>}
 */
tuitionRatesSchema.statics.isTitleTaken = async function (title, excludedTuitionRateId) {
  const tuitionRates = await this.findOne({ title, _id: { $ne: excludedTuitionRateId } });
  return !!tuitionRates;
};

/**
 * @typedef tuition rates
 */
const TuitionRates = mongoose.model('TuitionRates', tuitionRatesSchema);

module.exports = TuitionRates;
