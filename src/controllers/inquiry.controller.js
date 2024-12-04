const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { inquiryService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createInquiry = catchAsync(async (req, res) => {
  const inquiry = await inquiryService.createInquiry(req.body);
  res.status(httpStatus.CREATED).send(inquiry);
});

const getInquiries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['author', 'sender']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };

  const result = await inquiryService.queryInquiries(filter, options);
  res.send(result);
});

const getInquiry = catchAsync(async (req, res) => {
  const inquiry = await inquiryService.getInquiryById(req.params.inquiryId);
  if (!inquiry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inquiry not found');
  }
  res.send(inquiry);
});

const updateInquiry = catchAsync(async (req, res) => {
  const inquiry = await inquiryService.updateInquiryById(req.params.inquiryId, req.body);
  res.send(inquiry);
});

const deleteInquiry = catchAsync(async (req, res) => {
  await inquiryService.deleteInquiryById(req.params.inquiryId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiry,
  deleteInquiry,
};
