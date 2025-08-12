const express = require('express');
const validate = require('../../middlewares/validate');
const tuitionRateValidation = require('../../validations/tuitionRates.validation');
const tuitionRateController = require('../../controllers/tuition-rates.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(tuitionRateValidation.createTuitionRate), tuitionRateController.createTuitionRate)
  .get(validate(tuitionRateValidation.getTuitionRates), tuitionRateController.queryTuitionRates);

router
  .route('/:tuitionRatesId')
  .get(validate(tuitionRateValidation.getTuitionRate), tuitionRateController.getTuitionRate)
  .patch(validate(tuitionRateValidation.updateTuitionRates), tuitionRateController.updateTuitionRatesById)
  .delete(validate(tuitionRateValidation.deleteTuitionRates), tuitionRateController.deleteTuitionRate);

module.exports = router;
