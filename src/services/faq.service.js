const httpStatus = require('http-status');
const { Faq } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an Faq
 * @param {Object} faqBody
 * @returns {Promise<Faq>}
 */
const createFaq = async (faqBody) => {
  return Faq.create(faqBody);
};

/**
 * Query for FAQs
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryFaqs = async (filter, options) => {
  const faqs = await Faq.paginate(filter, options);
  return faqs;
};

/**
 * Get Faq by id
 * @param {ObjectId} id
 * @returns {Promise<Faq>}
 */
const getFaqById = async (id) => {
  return Faq.findById(id);
};

/**
 * Update Faq by id
 * @param {ObjectId} faqId
 * @param {Object} updateBody
 * @returns {Promise<Faq>}
 */
const updateFaqById = async (faqId, updateBody) => {
  const faq = await getFaqById(faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faq not found');
  }
  Object.assign(faq, updateBody);
  await faq.save();
  return faq;
};

/**
 * Delete Faq by id
 * @param {ObjectId} faqId
 * @returns {Promise<Faq>}
 */
const deleteFaqById = async (faqId) => {
  const faq = await getFaqById(faqId);
  if (!faq) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Faq not found');
  }
  await faq.remove();
  return faq;
};

module.exports = {
  createFaq,
  queryFaqs,
  getFaqById,
  updateFaqById,
  deleteFaqById,
};
