const express = require('express');
const validate = require('../../middlewares/validate');
const paperValidation = require('../../validations/paper.validation');
const paperController = require('../../controllers/paper.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(paperValidation.createPaper), paperController.createPaper)
  .get(validate(paperValidation.getPapers), paperController.getPapers);

router
  .route('/:paperId')
  .get(validate(paperValidation.getPaper), paperController.getPaper)
  .patch(validate(paperValidation.updatePaper), paperController.updatePaper)
  .delete(validate(paperValidation.deletePaper), paperController.deletePaper);

module.exports = router;
