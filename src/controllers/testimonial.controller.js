const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { testimonialService } = require('../services');
const ApiError = require('../utils/ApiError');
const pick = require('../utils/pick');

const createTestimonial = catchAsync(async (req, res) => {
  const testimonial = await testimonialService.createTestimonial(req.body);
  res.status(httpStatus.CREATED).send(testimonial);
});

const getTestimonials = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['author', 'content']);
  const options = {
    ...pick(req.query, ['sortBy', 'limit', 'page']),
  };

  const result = await testimonialService.queryTestimonials(filter, options);
  res.send(result);
});

const getTestimonial = catchAsync(async (req, res) => {
  const testimonial = await testimonialService.getTestimonialById(req.params.testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  res.send(testimonial);
});

const updateTestimonial = catchAsync(async (req, res) => {
  const testimonial = await testimonialService.updateTestimonialById(req.params.testimonialId, req.body);
  res.send(testimonial);
});

const deleteTestimonial = catchAsync(async (req, res) => {
  await testimonialService.deleteTestimonialById(req.params.testimonialId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
