const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageBlog'), validate(blogValidation.createBlog), blogController.createBlog)
  .get(validate(blogValidation.getBlogs), blogController.getBlogs);

/**
 * GET /v1/blogs/slug/:slug
 * Must be declared BEFORE /:blogId so Express doesn't treat "slug" as an ObjectId.
 */
router.route('/slug/:slug').get(validate(blogValidation.getBlogBySlug), blogController.getBlogBySlug);

/**
 * POST /v1/blogs/migrate-slugs
 * One-time back-fill for existing blogs. Admin only.
 */
router.route('/migrate-slugs').post(auth('manageUsers'), blogController.migrateSlugs);

router
  .route('/:blogId')
  .get(validate(blogValidation.getBlog), blogController.getBlog)
  .patch(auth('manageBlog'), validate(blogValidation.updateBlog), blogController.updateBlog)
  .delete(auth('manageBlog'), validate(blogValidation.deleteBlog), blogController.deleteBlog);

router
  .route('/:blogId/status')
  .patch(auth('manageUsers'), validate(blogValidation.updateBlogStatus), blogController.updateBlogStatus);

module.exports = router;
