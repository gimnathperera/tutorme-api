const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { blogService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');
const logger = require('../config/logger');
const { Blog } = require('../models');

const createBlog = catchAsync(async (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`Create Blog Payload: ${JSON.stringify(req.body, null, 2)}`);
  }
  const blog = await blogService.createBlog(req.body);
  res.status(httpStatus.CREATED).send(blog);
});

const getBlogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'status', 'tag']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await blogService.queryBlogs(filter, options);
  res.send(result);
});

const getBlog = catchAsync(async (req, res) => {
  const blog = await blogService.getBlogById(req.params.blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  res.send(blog);
});

/**
 * GET /v1/blogs/slug/:slug
 * Fetch a single blog by its SEO-friendly slug.
 */
const getBlogBySlug = catchAsync(async (req, res) => {
  const blog = await blogService.getBlogBySlug(req.params.slug);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  res.send(blog);
});

const updateBlog = catchAsync(async (req, res) => {
  const blog = await blogService.updateBlogById(req.params.blogId, req.body);
  res.send(blog);
});

const deleteBlog = catchAsync(async (req, res) => {
  await blogService.deleteBlogById(req.params.blogId);
  res.status(httpStatus.NO_CONTENT).send();
});

const updateBlogStatus = catchAsync(async (req, res) => {
  if (!req.body.status) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Status is required');
  }
  const blog = await blogService.updateBlogStatus(req.params.blogId, req.body.status);
  res.send(blog);
});

/**
 * POST /v1/blogs/migrate-slugs
 * One-time migration: back-fills slug on all existing blogs that have none.
 * Restricted to admin users. Safe to call multiple times (idempotent).
 */
const migrateSlugs = catchAsync(async (req, res) => {
  const blogsWithoutSlug = await Blog.find({ slug: { $exists: false } });

  const results = await Promise.all(
    blogsWithoutSlug.map(async (blog) => {
      try {
        // Trigger the pre-save hook by marking title as modified
        blog.markModified('title');
        await blog.save();
        return { id: blog.id, slug: blog.slug, status: 'ok' };
      } catch (err) {
        return { id: blog.id, status: 'error', error: err.message };
      }
    })
  );

  res.send({
    message: `Processed ${blogsWithoutSlug.length} blog(s) without a slug.`,
    results,
  });
});

module.exports = {
  createBlog,
  getBlogs,
  getBlog,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  updateBlogStatus,
  migrateSlugs,
};
