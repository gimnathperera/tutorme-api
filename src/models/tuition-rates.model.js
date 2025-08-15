const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tuitionRatesSchema = mongoose.Schema(
  {
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
    govTuitionRate: [
      {
        maximumRate: {
          type: String,
          required: true,
        },
        minimumRate: {
          type: String,
          required: true,
        },
      },
    ],
    partTimeTuitionRate: [
      {
        maximumRate: {
          type: String,
          required: true,
        },
        minimumRate: {
          type: String,
          required: true,
        },
      },
    ],
    fullTimeTuitionRate: [
      {
        maximumRate: {
          type: String,
          required: true,
        },
        minimumRate: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add plugins
tuitionRatesSchema.plugin(toJSON);
tuitionRatesSchema.plugin(paginate);

/**
 * Check if title is taken
 * @param {string} title - The tuition rate's title
 * @param {ObjectId} [excludedTuitionRateId] - The id of the tuition rate to be excluded
 * @returns {Promise<boolean>}
 */
tuitionRatesSchema.statics.isTitleTaken = async function (title, excludedTuitionRateId) {
  const tuitionRate = await this.findOne({ title, _id: { $ne: excludedTuitionRateId } });
  return !!tuitionRate;
};

/**
 * @typedef TuitionRates
 */
const TuitionRates = mongoose.model('TuitionRates', tuitionRatesSchema);

module.exports = TuitionRates;
