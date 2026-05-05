const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const rateRangeSchema = new mongoose.Schema(
  {
    minimumRate: {
      type: Number,
      required: true,
      min: 0,
    },
    maximumRate: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const tuitionRatesSchema = mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    universityStudentsRate: {
      type: rateRangeSchema,
      required: true,
    },
    partTimeTutorRate: {
      type: rateRangeSchema,
      required: true,
    },
    fullTimeTutorRate: {
      type: rateRangeSchema,
      required: true,
    },
    moeTeacherRate: {
      type: rateRangeSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tuitionRatesSchema.index({ subject: 1, grade: 1 }, { unique: true });

tuitionRatesSchema.plugin(toJSON);
tuitionRatesSchema.plugin(paginate);

const TuitionRates = mongoose.model('TuitionRates', tuitionRatesSchema);

module.exports = TuitionRates;
