const express = require('express');
const validate = require('../../middlewares/validate');
const tuitionRateValidation = require('../../validations/tuitionRates.validation');
const tuitionRateController = require('../../controllers/tuition-rates.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(tuitionRateValidation.createTuitionRate), tuitionRateController.createTuitionRate)
  .get(validate(tuitionRateValidation.getTuitionRates), tuitionRateController.queryTuitionRates);

router
  .route('/:tuitionRatesId')
  .get(validate(tuitionRateValidation.getTuitionRate), tuitionRateController.getTuitionRate)
  .patch(auth(), validate(tuitionRateValidation.updateTuitionRates), tuitionRateController.updateTuitionRatesById)
  .delete(auth(), validate(tuitionRateValidation.deleteTuitionRates), tuitionRateController.deleteTuitionRate);

module.exports = router;
