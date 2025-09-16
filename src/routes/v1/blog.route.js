const express = require('express');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(blogValidation.createBlog), blogController.createBlog)
  .get(validate(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/:blogId')
  .get(validate(blogValidation.getBlog), blogController.getBlog)
  .patch(validate(blogValidation.updateBlog), blogController.updateBlog)
  .delete(validate(blogValidation.deleteBlog), blogController.deleteBlog);

router.route('/:blogId/status').patch(validate(blogValidation.updateBlogStatus), blogController.updateBlogStatus);

module.exports = router;
