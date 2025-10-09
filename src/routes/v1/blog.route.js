const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const blogValidation = require('../../validations/blog.validation');
const blogController = require('../../controllers/blog.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(blogValidation.createBlog), blogController.createBlog)
  .get(validate(blogValidation.getBlogs), blogController.getBlogs);

router
  .route('/:blogId')
  .get(validate(blogValidation.getBlog), blogController.getBlog)
  .patch(auth(), validate(blogValidation.updateBlog), blogController.updateBlog)
  .delete(auth('manageUsers'), validate(blogValidation.deleteBlog), blogController.deleteBlog);

router
  .route('/:blogId/status')
  .patch(auth('manageUsers'), validate(blogValidation.updateBlogStatus), blogController.updateBlogStatus);

module.exports = router;
