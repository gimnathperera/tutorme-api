const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Testimonial } = require('../models');

/**
 * Create a testimonial
 * @param {Object} testimonialBody
 * @returns {Promise<Testimonial>}
 */
const createTestimonial = async (testimonialBody) => {
  return Testimonial.create(testimonialBody);
};

/**
 * Query for testimonials
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryTestimonials = async (filter, options) => {
  const testimonials = await Testimonial.paginate(filter, options);
  return testimonials;
};

/**
 * Get testimonial by id
 * @param {ObjectId} id
 * @returns {Promise<Testimonial>}
 */
const getTestimonialById = async (id) => {
  return Testimonial.findById(id);
};

/**
 * Update testimonial by id
 * @param {ObjectId} testimonialId
 * @param {Object} updateBody
 * @returns {Promise<Testimonial>}
 */
const updateTestimonialById = async (testimonialId, updateBody) => {
  const testimonial = await getTestimonialById(testimonialId);

  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }

  Object.assign(testimonial, updateBody);

  await testimonial.save();
  return testimonial;
};

/**
 * Delete testimonial by id
 * @param {ObjectId} testimonialId
 * @returns {Promise<Testimonial>}
 */
const deleteTestimonialById = async (testimonialId) => {
  const testimonial = await getTestimonialById(testimonialId);
  if (!testimonial) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  await testimonial.remove();
  return testimonial;
};

module.exports = {
  createTestimonial,
  queryTestimonials,
  getTestimonialById,
  updateTestimonialById,
  deleteTestimonialById,
};
