const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const blogSchema = mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    date: { type: Date, default: Date.now },
    author: {
      name: { type: String, required: true },
      avatar: String,
      role: String,
    },
    content: [
      {
        type: { type: String, required: true }, // "paragraph", "image", "heading"
        text: String,
        src: String,
        caption: String,
        level: Number,
      },
    ],
    relatedArticles: [
      {
        title: String,
        description: String,
        image: String,
        readTime: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

/**
 * @typedef Blog
 */
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
