const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

/**
 * Generate a URL-safe slug from a title string.
 * e.g. "The Business Value of Software QA!" → "the-business-value-of-software-qa"
 */
const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric (keep spaces & hyphens)
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens

const blogSchema = mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },

    // SEO-friendly slug — auto-generated from title, must be unique
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // allows null/undefined on old docs until they are saved again
      trim: true,
    },

    author: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      role: { type: String, enum: ['admin', 'tutor'], required: true },
    },
    image: { type: String, required: true },
    content: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
    },
    relatedArticles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
      },
    ],
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    faqs: [
      {
        question: { type: String, required: true },
        answer: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook: generate a unique slug whenever the title changes (or on first save).
 * Uniqueness is enforced by appending -2, -3 … until a free slug is found.
 */
blogSchema.pre('save', async function (next) {
  // Only regenerate if slug is missing or title was changed
  if (!this.isModified('title') && this.slug) {
    return next();
  }

  const baseSlug = slugify(this.title);
  let candidate = baseSlug;
  let counter = 1;

  // Keep incrementing until we find a slug not used by another document
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Check if any OTHER document already has this slug
    // eslint-disable-next-line no-await-in-loop
    const existing = await this.constructor.findOne({
      slug: candidate,
      _id: { $ne: this._id },
    });

    if (!existing) {
      break; // slug is free
    }

    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  this.slug = candidate;
  next();
});

blogSchema.plugin(toJSON);
blogSchema.plugin(paginate);

/**
 * @typedef Blog
 */
const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
