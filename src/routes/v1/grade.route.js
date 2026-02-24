const express = require('express');
const validate = require('../../middlewares/validate');
const gradeValidation = require('../../validations/grade.validation');
const gradeController = require('../../controllers/grade.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(gradeValidation.createGrade), gradeController.createGrade)
  .get(validate(gradeValidation.getGrades), gradeController.getGrades);

router.post('/subjects-by-grades', validate(gradeValidation.getSubjectsForGrades), gradeController.getSubjectsForGrades);

router
  .route('/:gradeId')
  .get(validate(gradeValidation.getGrade), gradeController.getGrade)
  .patch(auth('manageUsers'), validate(gradeValidation.updateGrade), gradeController.updateGrade)
  .delete(auth('manageUsers'), validate(gradeValidation.deleteGrade), gradeController.deleteGrade);

module.exports = router;
