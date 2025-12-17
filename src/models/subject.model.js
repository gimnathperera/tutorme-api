const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const subjectSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
  },

  {
    timestamps: true,
  }
);
subjectSchema.index({ title: 1 }, { unique: true });

subjectSchema.plugin(toJSON);
subjectSchema.plugin(paginate);

/**
 * @typedef Subject
 */
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
