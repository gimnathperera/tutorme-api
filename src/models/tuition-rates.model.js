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
 * @typedef TuitionRates
 */
const TuitionRates = mongoose.model('TuitionRates', tuitionRatesSchema);

module.exports = TuitionRates;
