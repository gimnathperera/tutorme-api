const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { formatPaperMedium } = require('../config/paper');

const papersSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    medium: {
      type: String,
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
    year: {
      type: Number,
    },
    url: {
      type: String,
      trim: true,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        const medium = formatPaperMedium(ret.medium);
        // eslint-disable-next-line no-param-reassign
        ret.medium = medium || null;
      },
    },
  }
);

// add plugin that converts mongoose to json
papersSchema.plugin(toJSON);
papersSchema.plugin(paginate);

/**
 * @typedef Paper
 */
const Paper = mongoose.model('Paper', papersSchema);

module.exports = Paper;
