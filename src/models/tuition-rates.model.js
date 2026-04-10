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
    onlineIndividualTuitionRate: [
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
    onlineGroupTuitionRate: [
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
    physicalIndividualTuitionRate: [
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
    physicalGroupTuitionRate: [
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
tuitionRatesSchema.index({ subject: 1, grade: 1 }, { unique: true });

tuitionRatesSchema.plugin(toJSON);
tuitionRatesSchema.plugin(paginate);

/**
 * @typedef TuitionRates
 */
const TuitionRates = mongoose.model('TuitionRates', tuitionRatesSchema);

module.exports = TuitionRates;
