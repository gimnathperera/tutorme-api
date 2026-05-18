const express = require('express');
const validate = require('../../middlewares/validate');
const subjectValidation = require('../../validations/subject.validation');
const subjectController = require('../../controllers/subject.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(subjectValidation.createSubject), subjectController.createSubject)
  .get(validate(subjectValidation.getSubjects), subjectController.getSubjects);

router
  .route('/:subjectId')
  .get(validate(subjectValidation.getSubject), subjectController.getSubject)
  .patch(auth('manageUsers'), validate(subjectValidation.updateSubject), subjectController.updateSubject)
  .delete(auth('manageUsers'), validate(subjectValidation.deleteSubject), subjectController.deleteSubject);

module.exports = router;
