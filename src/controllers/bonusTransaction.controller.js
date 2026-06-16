const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { bonusTransactionService } = require('../services');

const getTransactions = catchAsync(async (req, res) => {
  const { page, limit } = req.query;
  const result = await bonusTransactionService.getTransactions({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.send(result);
});

const getTransactionById = catchAsync(async (req, res) => {
  const transaction = await bonusTransactionService.getTransactionById(req.params.id);
  res.send(transaction);
});

const uploadSlip = catchAsync(async (req, res) => {
  await bonusTransactionService.uploadSlip(req.params.id, req.body);
  res.status(httpStatus.NO_CONTENT).send();
});

const getSlip = catchAsync(async (req, res) => {
  const slip = await bonusTransactionService.getSlip(req.params.id);
  res.send(slip);
});

module.exports = { getTransactions, getTransactionById, uploadSlip, getSlip };
