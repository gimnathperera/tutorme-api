const express = require('express');
const validate = require('../../middlewares/validate');
const levelValidation = require('../../validations/level.validation');
const levelController = require('../../controllers/level.controller');

const router = express.Router();

router
  .route('/')
  .post(validate(levelValidation.createLevel), levelController.createLevel)
  .get(validate(levelValidation.getLevels), levelController.getLevels);

router
  .route('/:levelId')
  .get(validate(levelValidation.getLevel), levelController.getLevel)
  .patch(validate(levelValidation.updateLevel), levelController.updateLevel)
  .delete(validate(levelValidation.deleteLevel), levelController.deleteLevel);

module.exports = router;
