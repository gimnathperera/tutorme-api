const express = require('express');
const validate = require('../../middlewares/validate');
const tutorValidation = require('../../validations/tutor.validation');
const tutorController = require('../../controllers/tutor.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(validate(tutorValidation.createTutor), tutorController.createTutor)
  .get(validate(tutorValidation.getTutors), tutorController.getTutors);

router
  .route('/:tutorId')
  .get(validate(tutorValidation.getTutor), tutorController.getTutor)
  .patch(auth('manageUsers'), validate(tutorValidation.updateTutor), tutorController.updateTutor)
  .delete(auth('manageUsers'), validate(tutorValidation.deleteTutor), tutorController.deleteTutor);

router.route('/change-password/:tutorId').patch(validate(tutorValidation.changePassword), tutorController.changePassword);

router
  .route('/temp-password/:tutorId')
  .post(auth('manageUsers'), validate(tutorValidation.generateTempPassword), tutorController.generateTempPassword);

router.post('/match-by-subjects', validate(tutorValidation.matchTutorsBySubjects), tutorController.matchTutorsBySubjects);

module.exports = router;
