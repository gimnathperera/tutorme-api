const express = require('express');
const validate = require('../../middlewares/validate');
const paperValidation = require('../../validations/paper.validation');
const paperController = require('../../controllers/paper.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(paperValidation.createPaper), paperController.createPaper)
  .get(validate(paperValidation.getPapers), paperController.getPapers);

router.get('/mediums', validate(paperValidation.getPaperMediums), paperController.getPaperMediums);

router
  .route('/:paperId')
  .get(validate(paperValidation.getPaper), paperController.getPaper)
  .patch(auth(), validate(paperValidation.updatePaper), paperController.updatePaper)
  .delete(auth('manageUsers'), validate(paperValidation.deletePaper), paperController.deletePaper);

module.exports = router;
