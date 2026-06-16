const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const bonusTransactionValidation = require('../../validations/bonusTransaction.validation');
const bonusTransactionController = require('../../controllers/bonusTransaction.controller');

const router = express.Router();

router
  .route('/')
  .get(
    auth('manageUsers'),
    validate(bonusTransactionValidation.getTransactions),
    bonusTransactionController.getTransactions
  );

router
  .route('/:id')
  .get(
    auth('manageUsers'),
    validate(bonusTransactionValidation.getTransactionById),
    bonusTransactionController.getTransactionById
  );

router
  .route('/:id/slip')
  .get(auth('manageUsers'), validate(bonusTransactionValidation.getSlip), bonusTransactionController.getSlip)
  .post(auth('manageUsers'), validate(bonusTransactionValidation.uploadSlip), bonusTransactionController.uploadSlip);

module.exports = router;
