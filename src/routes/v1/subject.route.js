const express = require('express');
const validate = require('../../middlewares/validate');
const subjectValidation = require('../../validations/subject.validation');
const subjectController = require('../../controllers/subject.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(validate(auth('manageUsers'), subjectValidation.createSubject), subjectController.createSubject)
  .get(validate(subjectValidation.getSubjects), subjectController.getSubjects);

router
  .route('/:subjectId')
  .get(validate(subjectValidation.getSubject), subjectController.getSubject)
  .patch(validate(auth('manageUsers'), subjectValidation.updateSubject), subjectController.updateSubject)
  .delete(validate(auth('manageUsers'), subjectValidation.deleteSubject), subjectController.deleteSubject);

module.exports = router;
