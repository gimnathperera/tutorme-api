const express = require('express');
const validate = require('../../middlewares/validate');
const requestTutorValidation = require('../../validations/requestTutor.validation');
const requestTutorController = require('../../controllers/requestTutor.controllers');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(validate(requestTutorValidation.createRequestTutor), requestTutorController.createTutorRequest)
  .get(validate(requestTutorValidation.getTutors), requestTutorController.getTutorRequests);

router
  .route('/:requestTutorId')
  .get(validate(requestTutorValidation.getTutor), requestTutorController.getTutorById)
  .delete(auth('manageUsers'), validate(requestTutorValidation.deleteTutor), requestTutorController.deleteTutor);

router
  .route('/status/:requestTutorId')
  .patch(auth('manageUsers'), validate(requestTutorValidation.updateStatus), requestTutorController.updateStatus);

router
  .route('/assigned-tutor/:tutorBlockId')
  .patch(
    auth('manageUsers'),
    validate(requestTutorValidation.updateAssignedTutor),
    requestTutorController.updateAssignedTutor
  );

module.exports = router;
