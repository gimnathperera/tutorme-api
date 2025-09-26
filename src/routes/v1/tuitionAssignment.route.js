const express = require('express');
const validate = require('../../middlewares/validate');
const tuitionAssignmentValidation = require('../../validations/tuitionAssignment.validation');
const tuitionAssignmentController = require('../../controllers/tuitionAssignment.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(
    auth(),
    validate(tuitionAssignmentValidation.createTuitionAssignment),
    tuitionAssignmentController.createTuitionAssignment
  )
  .get(validate(tuitionAssignmentValidation.getTuitionAssignments), tuitionAssignmentController.getTuitionAssignments);

router
  .route('/:tuitionAssignmentId')
  .get(validate(tuitionAssignmentValidation.getTuitionAssignment), tuitionAssignmentController.getTuitionAssignment)
  .patch(
    auth(),
    validate(tuitionAssignmentValidation.updateTuitionAssignment),
    tuitionAssignmentController.updateTuitionAssignment
  )
  .delete(
    auth(),
    validate(tuitionAssignmentValidation.deleteTuitionAssignment),
    tuitionAssignmentController.deleteTuitionAssignment
  );

module.exports = router;
