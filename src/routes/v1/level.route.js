const express = require('express');
const validate = require('../../middlewares/validate');
const levelValidation = require('../../validations/level.validation');
const levelController = require('../../controllers/level.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(levelValidation.createLevel), levelController.createLevel)
  .get(validate(levelValidation.getLevels), levelController.getLevels);

router
  .route('/:levelId')
  .get(validate(levelValidation.getLevel), levelController.getLevel)
  .patch(auth('manageUsers'), validate(levelValidation.updateLevel), levelController.updateLevel)
  .delete(auth('manageUsers'), validate(levelValidation.deleteLevel), levelController.deleteLevel);

module.exports = router;
