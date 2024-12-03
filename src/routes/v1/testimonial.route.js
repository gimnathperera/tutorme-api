const express = require('express');
const validate = require('../../middlewares/validate');
const testimonialValidation = require('../../validations/testimonial.validation');
const testimonialController = require('../../controllers/testimonial.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(testimonialValidation.createTestimonial), testimonialController.createTestimonial)
  .get(validate(testimonialValidation.getTestimonials), testimonialController.getTestimonials);

router
  .route('/:testimonialId')
  .get(validate(testimonialValidation.getTestimonial), testimonialController.getTestimonial)
  .patch(validate(testimonialValidation.updateTestimonial), testimonialController.updateTestimonial)
  .delete(validate(testimonialValidation.deleteTestimonial), testimonialController.deleteTestimonial);

module.exports = router;
