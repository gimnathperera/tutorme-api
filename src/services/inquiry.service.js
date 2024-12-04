const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { Inquiry } = require('../models');

/**
 * Create an inquiry
 * @param {Object} inquiryBody
 * @returns {Promise<Inquiry>}
 */
const createInquiry = async (inquiryBody) => {
  return Inquiry.create(inquiryBody);
};

/**
 * Query for inquiries
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInquiries = async (filter, options) => {
  const inquiries = await Inquiry.paginate(filter, options);
  return inquiries;
};

/**
 * Get inquiry by id
 * @param {ObjectId} id
 * @returns {Promise<Inquiry>}
 */
const getInquiryById = async (id) => {
  return Inquiry.findById(id);
};

/**
 * Update inquiry by id
 * @param {ObjectId} inquiryId
 * @param {Object} updateBody
 * @returns {Promise<Inquiry>}
 */
const updateInquiryById = async (inquiryId, updateBody) => {
  const inquiry = await getInquiryById(inquiryId);

  if (!inquiry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inquiry not found');
  }

  Object.assign(inquiry, updateBody);

  await inquiry.save();
  return inquiry;
};

/**
 * Delete inquiry by id
 * @param {ObjectId} inquiryId
 * @returns {Promise<Inquiry>}
 */
const deleteInquiryById = async (inquiryId) => {
  const inquiry = await getInquiryById(inquiryId);
  if (!inquiry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Inquiry not found');
  }
  await inquiry.remove();
  return inquiry;
};

module.exports = {
  createInquiry,
  queryInquiries,
  getInquiryById,
  updateInquiryById,
  deleteInquiryById,
};
