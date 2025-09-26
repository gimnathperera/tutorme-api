const express = require('express');
const validate = require('../../middlewares/validate');
const testimonialValidation = require('../../validations/testimonial.validation');
const testimonialController = require('../../controllers/testimonial.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(testimonialValidation.createTestimonial), testimonialController.createTestimonial)
  .get(validate(testimonialValidation.getTestimonials), testimonialController.getTestimonials);

router
  .route('/:testimonialId')
  .get(validate(testimonialValidation.getTestimonial), testimonialController.getTestimonial)
  .patch(auth('manageUsers'), validate(testimonialValidation.updateTestimonial), testimonialController.updateTestimonial)
  .delete(auth('manageUsers'), validate(testimonialValidation.deleteTestimonial), testimonialController.deleteTestimonial);

module.exports = router;
