const express = require('express');
const validate = require('../../middlewares/validate');
const tuitionRatesValidation = require('../../validations/tuitionRates.validation');
const tuitionRatesController = require('../../controllers/tuitionRates.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(tuitionRatesValidation.createTuitionRate), tuitionRatesController.createTuitionRate)
  .get(validate(tuitionRatesValidation.getTuitionRates), tuitionRatesController.getTuitionRates);

router
  .route('/:tuitionRateId')
  .get(validate(tuitionRatesValidation.getTuitionRate), tuitionRatesController.getTuitionRate)
  .patch(validate(tuitionRatesValidation.updateTuitionRate), tuitionRatesController.updateTuitionRate)
  .delete(validate(tuitionRatesValidation.deleteTuitionRate), tuitionRatesController.deleteTuitionRate);

module.exports = router;
