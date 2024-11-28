const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const gradeSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gradeSchema.plugin(toJSON);
gradeSchema.plugin(paginate);

/**
 * @typedef Grade
 */
const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
