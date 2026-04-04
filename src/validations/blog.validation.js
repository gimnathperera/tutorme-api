const Joi = require('joi');
const mongoose = require('mongoose');

const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.message('Invalid ID');
    }
    return value;
  });

const contentBlockSchema = Joi.alternatives().try(
  Joi.object({
    type: Joi.string().valid('paragraph').required(),
    text: Joi.string().allow('', null).required(),
  }),
  Joi.object({
    type: Joi.string().valid('heading').required(),
    text: Joi.string().allow('', null).required(),
    level: Joi.number().valid(1, 2, 3, 4, 5, 6),
  }),
  Joi.object({
    type: Joi.string().valid('image').required(),
    src: Joi.string().required(),
    caption: Joi.string().allow('', null),
  }),
  Joi.object({
    type: Joi.string().valid('table').required(),
    headers: Joi.array().items(Joi.string().allow('', null)),
    rows: Joi.array().items(Joi.array().items(Joi.string().allow('', null))),
  }),
  Joi.object({
    type: Joi.string().valid('quote').required(),
    text: Joi.string().allow('', null).required(),
    citation: Joi.string().allow('', null),
  }),
  Joi.object({
    type: Joi.string().valid('list').required(),
    items: Joi.array().items(Joi.string().allow('', null)).required(),
    style: Joi.string().valid('ordered', 'unordered').allow('', null),
  }),
  Joi.object({
    type: Joi.string().valid('embed').required(),
    src: Joi.string().allow('', null),
    html: Joi.string().allow('', null),
  }),
  Joi.object({
    type: Joi.string().required(),
  }).unknown(true)
);

const createBlog = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    date: Joi.date(),
    image: Joi.string(),
    content: Joi.array().items(contentBlockSchema).required(),
    relatedArticles: Joi.array().items(objectId()),
    tags: Joi.array().items(objectId()),
    faqs: Joi.array().items(
      Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      })
    ),
    status: Joi.string().valid('pending', 'published', 'draft'),
  }),
};

const updateBlog = {
  params: Joi.object().keys({
    blogId: objectId().required(), // making explicit requirement just in case
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),
      date: Joi.date(),
      tags: Joi.array().items(objectId()),
      image: Joi.string(),
      content: Joi.array().items(contentBlockSchema),
      relatedArticles: Joi.array().items(objectId()),
      faqs: Joi.array().items(
        Joi.object({
          question: Joi.string().required(),
          answer: Joi.string().required(),
        })
      ),
      status: Joi.string().valid('pending', 'published', 'draft'),
    })
    .min(1),
};

const getBlogs = {
  query: Joi.object().keys({
    title: Joi.string(),
    tags: Joi.array().items(objectId()),
    status: Joi.string().valid('pending', 'published', 'draft'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getBlog = {
  params: Joi.object().keys({
    blogId: objectId().required(),
  }),
};

// Slug is a plain string, not an ObjectId
const getBlogBySlug = {
  params: Joi.object().keys({
    slug: Joi.string().trim().min(1).required(),
  }),
};

const deleteBlog = {
  params: Joi.object().keys({
    blogId: objectId().required(),
  }),
};

const updateBlogStatus = {
  params: Joi.object().keys({
    blogId: objectId().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('pending', 'published', 'draft').required(),
  }),
};

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  updateBlogStatus,
};
