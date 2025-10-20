const Joi = require('joi');
const mongoose = require('mongoose');

const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message('Invalid ID');
    }
    return value;
  });

// Create Blog
const createBlog = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    date: Joi.date(),
    author: Joi.object({
      name: Joi.string().required(),
      avatar: Joi.string().uri(),
      role: Joi.string(),
    }).required(),
    image: Joi.string().uri(),
    content: Joi.string.required(),
    relatedArticles: Joi.array().items(Joi.string().hex().length(24)),
    tags: Joi.array().optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
  }),
};

// Get Blogs (with optional filters)
const getBlogs = {
  query: Joi.object().keys({
    title: Joi.string(),
    tags: Joi.array().optional(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

// Get Blog by ID
const getBlog = {
  params: Joi.object().keys({
    blogId: objectId(),
  }),
};

// Update Blog
const updateBlog = {
  params: Joi.object().keys({
    blogId: objectId(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      date: Joi.date(),
      tags: Joi.array().optional(),
      author: Joi.object({
        name: Joi.string(),
        avatar: Joi.string().uri(),
        role: Joi.string(),
      }),
      image: Joi.string().uri(),
      content: Joi.string.required(),
      relatedArticles: Joi.array().items(Joi.string().hex().length(24)),
      status: Joi.string().valid('pending', 'approved', 'rejected'),
    })
    .min(1),
};

// Delete Blog
const deleteBlog = {
  params: Joi.object().keys({
    blogId: objectId(),
  }),
};

// Update Blog Status
const updateBlogStatus = {
  params: Joi.object().keys({
    blogId: objectId(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('pending', 'approved', 'rejected').required(),
  }),
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  updateBlogStatus,
};
