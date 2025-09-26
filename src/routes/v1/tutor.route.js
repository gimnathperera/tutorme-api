const express = require('express');
const validate = require('../../middlewares/validate');
const tutorValidation = require('../../validations/tutor.validation');
const tutorController = require('../../controllers/tutor.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(tutorValidation.createTutor), tutorController.createTutor)
  .get(validate(tutorValidation.getTutors), tutorController.getTutors);

router
  .route('/:tutorId')
  .get(validate(tutorValidation.getTutor), tutorController.getTutor)
  .patch(validate(tutorValidation.updateTutor), tutorController.updateTutor)
  .delete(validate(tutorValidation.deleteTutor), tutorController.deleteTutor);

router.route('/change-password/:tutorId').patch(validate(tutorValidation.changePassword), tutorController.changePassword);

router
  .route('/temp-password/:tutorId')
  .post(validate(tutorValidation.generateTempPassword), tutorController.generateTempPassword);

module.exports = router;
