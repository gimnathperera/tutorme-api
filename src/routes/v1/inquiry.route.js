const express = require('express');
const validate = require('../../middlewares/validate');
const inquiryValidation = require('../../validations/inquiry.validation');
const inquiryController = require('../../controllers/inquiry.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(inquiryValidation.createInquiry), inquiryController.createInquiry)
  .get(validate(inquiryValidation.getInquiries), inquiryController.getInquiries);

router
  .route('/:inquiryId')
  .get(validate(inquiryValidation.getInquiry), inquiryController.getInquiry)
  .patch(validate(inquiryValidation.updateInquiry), inquiryController.updateInquiry)
  .delete(validate(inquiryValidation.deleteInquiry), inquiryController.deleteInquiry);

module.exports = router;
