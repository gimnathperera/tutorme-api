const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

// Define the TuitionRate schema
const tuitionRateSchema = mongoose.Schema(
  {
    tutorType: {
      type: String,
      enum: ['university_student', 'graduate_teacher', 'gov_school_teacher'],
      required: true,
      index: true,
    },
    gradeLevel: {
      type: String,
      enum: [
        'grade_1',
        'grade_2',
        'grade_3',
        'grade_4',
        'grade_5',
        'grade_6',
        'grade_7',
        'grade_8',
        'grade_9',
        'grade_10',
        'grade_11',
        'grade_12',
        'grade_1_5',
        'grade_6_9',
        'o_level',
        'a_level',
      ],
      required: true,
      index: true,
    },
    rateRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    currency: {
      type: String,
      length: 3,
      uppercase: true,
      default: 'LKR',
    },
  },
  {
    timestamps: true, // createdAt & updatedAt fields
  }
);

// add plugin that converts mongoose to json
tuitionRateSchema.plugin(toJSON);
tuitionRateSchema.plugin(paginate);

/**
 * @typedef TuitionRate
 */
const TuitionRate = mongoose.model('TuitionRate', tuitionRateSchema);

module.exports = TuitionRate;
