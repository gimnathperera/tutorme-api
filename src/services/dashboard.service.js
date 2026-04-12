const { User, Tutor, RequestTutor } = require('../models');

const getDashboardSummary = async () => {
  const [registeredTutors, registeredStudents, requestTutorRequests, registerAsTutorRequests] = await Promise.all([
    User.countDocuments({ role: 'tutor' }),
    User.countDocuments({ role: 'user' }),
    RequestTutor.countDocuments(),
    Tutor.countDocuments(),
  ]);

  return {
    registeredTutors,
    registeredStudents,
    requestTutorRequests,
    registerAsTutorRequests,
  };
};

module.exports = {
  getDashboardSummary,
};
