const { tutorTypes } = require('./enums');

const tutorStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

module.exports = {
  tutorStatus,
  tutorTypes,
};
