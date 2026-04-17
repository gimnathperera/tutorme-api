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
const queryBlogs = async (filter, options, user) => {
  const query = { ...filter };
  if (filter.tag) {
    query.tags = filter.tag;
    delete query.tag;
  }

  // Role-based status filtering
  if (!user || user.role === 'user') {
    // Not logged in or regular user — only approved blogs
    query.status = 'approved';
  } else if (user.role === 'tutor') {
    // Tutor sees approved blogs + their own pending/rejected blogs
    delete query.status;
    query.$or = [{ status: 'approved' }, { status: { $in: ['pending', 'rejected'] }, 'author.id': user.id }];
  } else if (user.role === 'admin') {
    // Admin sees all blogs — ignore any status filter from query params
    delete query.status;
  }

  const blogs = await Blog.paginate(query, {
    ...options,
    populate: 'tags relatedArticles',
    select: 'title slug author image content relatedArticles tags faqs status createdAt updatedAt',
  });

  return blogs;
};

/**
 * Get Blog by ID
 * @param {ObjectId} id
 * @returns {Promise<Blog>}
 */
const getBlogById = async (id) => {
  return Blog.findById(id).populate('relatedArticles', 'title image author slug').populate('tags', 'name');
};

/**
 * Get Blog by slug (SEO-friendly URL lookup)
 * @param {string} slug
 * @returns {Promise<Blog>}
 */
const getBlogBySlug = async (slug) => {
  return Blog.findOne({ slug }).populate('relatedArticles', 'title image author slug').populate('tags', 'name');
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
  await blog.save(); // pre-save hook will regenerate slug if title changed
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
  await blog.deleteOne();
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
  getBlogBySlug,
  updateBlogById,
  deleteBlogById,
  updateBlogStatus,
};
