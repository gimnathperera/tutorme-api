const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tuitionRateRangeSchema = mongoose.Schema({
  maximumRate: {
    type: String,
    required: true,
  },
  minimumRate: {
    type: String,
    required: true,
  },
});

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
    partTimeTuitionRate: [tuitionRateRangeSchema],
    fullTimeTuitionRate: [tuitionRateRangeSchema],
    govTuitionRate: [tuitionRateRangeSchema],
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
