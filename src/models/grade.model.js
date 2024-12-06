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
    description: {
      type: String,
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
gradeSchema.plugin(toJSON);
gradeSchema.plugin(paginate);

/**
 * Check if title is taken
 * @param {string} title - The grade's title
 * @param {ObjectId} [excludedGradeId] - The id of the grade to be excluded
 * @returns {Promise<boolean>}
 */
gradeSchema.statics.isTitleTaken = async function (title, excludedGradeId) {
  const grade = await this.findOne({ title, _id: { $ne: excludedGradeId } });
  return !!grade;
};

/**
 * @typedef Grade
 */
const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
