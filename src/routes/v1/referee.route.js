const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const refereeValidation = require('../../validations/referee.validation');
const refereeController = require('../../controllers/referee.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(refereeValidation.createReferee), refereeController.createReferee)
  .get(auth('manageUsers'), validate(refereeValidation.getReferees), refereeController.getReferees);

router
  .route('/email-availability')
  .get(auth('manageUsers'), validate(refereeValidation.getEmailAvailability), refereeController.getEmailAvailability);

router
  .route('/:refereeId')
  .patch(auth('manageUsers'), validate(refereeValidation.updateReferee), refereeController.updateReferee)
  .delete(auth('manageUsers'), validate(refereeValidation.deleteReferee), refereeController.deleteReferee);

module.exports = router;
