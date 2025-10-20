const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const tagValidation = require('../../validations/tag.validation');
const tagController = require('../../controllers/tag.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(tagValidation.createTag), tagController.createTag)
  .get(validate(tagValidation.getTags), tagController.getTags);

router
  .route('/:tagId')
  .get(validate(tagValidation.getTag), tagController.getTag)
  .patch(auth(), validate(tagValidation.updateTag), tagController.updateTag)
  .delete(auth('manageUsers'), validate(tagValidation.deleteTag), tagController.deleteTag);

module.exports = router;
