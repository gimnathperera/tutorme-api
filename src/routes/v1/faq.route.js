const express = require('express');
const validate = require('../../middlewares/validate');
const faqValidation = require('../../validations/faq.validation');
const faqController = require('../../controllers/faq.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(faqValidation.createFaq), faqController.createFaq)
  .get(validate(faqValidation.getFaqs), faqController.getFaqs);

router
  .route('/:faqId')
  .get(validate(faqValidation.getFaq), faqController.getFaq)
  .patch(validate(faqValidation.updateFaq), faqController.updateFaq)
  .delete(validate(faqValidation.deleteFaq), faqController.deleteFaq);

module.exports = router;
