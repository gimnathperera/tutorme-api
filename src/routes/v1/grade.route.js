const express = require('express');
const validate = require('../../middlewares/validate');
const gradeValidation = require('../../validations/grade.validation');
const gradeController = require('../../controllers/grade.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(gradeValidation.createGrade), gradeController.createGrade)
  .get(validate(gradeValidation.getGrades), gradeController.getGrades);

router
  .route('/:gradeId')
  .get(validate(gradeValidation.getGrade), gradeController.getGrade)
  .patch(validate(gradeValidation.updateGrade), gradeController.updateGrade)
  .delete(validate(gradeValidation.deleteGrade), gradeController.deleteGrade);

module.exports = router;
