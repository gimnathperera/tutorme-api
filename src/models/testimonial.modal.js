const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ownerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
  },
  { _id: false }
);

const testimonialSchema = mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: ownerSchema,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
testimonialSchema.plugin(toJSON);
testimonialSchema.plugin(paginate);

/**
 * @typedef Grade
 */
const Grade = mongoose.model('Testimonial', testimonialSchema);

module.exports = Grade;
