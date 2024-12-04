const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const senderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const inquirySchema = mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sender: {
      type: senderSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
inquirySchema.plugin(toJSON);
inquirySchema.plugin(paginate);

/**
 * @typedef Inquiry
 */
const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
