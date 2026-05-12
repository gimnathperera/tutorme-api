const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { faqCategories, defaultFaqCategory } = require('../config/enums');

const faqSchema = mongoose.Schema(
  {
    category: {
      type: String,
      enum: faqCategories,
      default: defaultFaqCategory,
      index: true,
    },
    question: {
      type: String,
      required: true,
      index: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
faqSchema.plugin(toJSON);
faqSchema.plugin(paginate);

/**
 * @typedef Faq
 */
const Faq = mongoose.model('Faq', faqSchema);

module.exports = Faq;
