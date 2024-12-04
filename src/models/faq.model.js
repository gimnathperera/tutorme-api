const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const faqSchema = mongoose.Schema(
  {
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
