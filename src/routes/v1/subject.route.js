const express = require('express');
const validate = require('../../middlewares/validate');
const subjectValidation = require('../../validations/subject.validation');
const subjectController = require('../../controllers/subject.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(subjectValidation.createSubject), subjectController.createSubject)
  .get(validate(subjectValidation.getSubjects), subjectController.getSubjects);

router
  .route('/:subjectId')
  .get(validate(subjectValidation.getSubject), subjectController.getSubject)
  .patch(validate(subjectValidation.updateSubject), subjectController.updateSubject)
  .delete(validate(subjectValidation.deleteSubject), subjectController.deleteSubject);

module.exports = router;
