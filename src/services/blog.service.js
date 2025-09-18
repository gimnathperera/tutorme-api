const httpStatus = require('http-status');
const { Blog } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a Blog
 * @param {Object} blogBody
 * @returns {Promise<Blog>}
 */
const createBlog = async (blogBody) => {
  return Blog.create(blogBody);
};

/**
 * Query for Blogs
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryBlogs = async (filter, options) => {
  const blogs = await Blog.paginate(filter, options);
  return blogs;
};

/**
 * Get Blog by ID
 * @param {ObjectId} id
 * @returns {Promise<Blog>}
 */
const getBlogById = async (id) => {
  return Blog.findById(id).populate('relatedArticles', 'title image author avatar');
};

/**
 * Update Blog by ID
 * @param {ObjectId} blogId
 * @param {Object} updateBody
 * @returns {Promise<Blog>}
 */
const updateBlogById = async (blogId, updateBody) => {
  const blog = await getBlogById(blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  Object.assign(blog, updateBody);
  await blog.save();
  return blog;
};

/**
 * Delete Blog by ID
 * @param {ObjectId} blogId
 * @returns {Promise<Blog>}
 */
const deleteBlogById = async (blogId) => {
  const blog = await getBlogById(blogId);
  if (!blog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Blog not found');
  }
  await blog.remove();
  return blog;
};

/**
 * Update Blog Status (approve/reject)
 * @param {ObjectId} blogId
 * @param {string} status
 * @returns {Promise<Blog>}
 */
const updateBlogStatus = async (blogId, status) => {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status');
  }
  return updateBlogById(blogId, { status });
};

module.exports = {
  createBlog,
  queryBlogs,
  getBlogById,
  updateBlogById,
  deleteBlogById,
  updateBlogStatus,
};
