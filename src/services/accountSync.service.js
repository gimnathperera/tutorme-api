const httpStatus = require('http-status');
const { User, Tutor } = require('../models');
const ApiError = require('../utils/ApiError');

const shouldSyncTutorToUser = (tutor) => tutor.status === 'approved' || Boolean(tutor.userId);
const tutorStatuses = ['pending', 'approved', 'rejected', 'suspended'];

const getTutorStatusFromUser = (status) => {
  if (status === 'active') {
    return 'approved';
  }

  return tutorStatuses.includes(status) ? status : undefined;
};

const getTutorCertificatesFromUser = (user, tutor) => {
  if (!Array.isArray(user.certificatesAndQualifications)) {
    return undefined;
  }

  const existingCertificates = Array.isArray(tutor.certificatesAndQualifications) ? tutor.certificatesAndQualifications : [];

  return user.certificatesAndQualifications.map((certificateUrl) => {
    const existingCertificate = existingCertificates.find((certificate) => certificate.url === certificateUrl);

    return {
      type: (existingCertificate && existingCertificate.type) || 'Certificate',
      url: certificateUrl,
    };
  });
};

const removeUndefinedValues = (payload) =>
  Object.entries(payload).reduce((cleanPayload, [key, value]) => {
    if (value !== undefined) {
      return { ...cleanPayload, [key]: value };
    }

    return cleanPayload;
  }, {});

const getTutorLinkedUser = async (tutor) => {
  if (tutor.userId) {
    return User.findById(tutor.userId);
  }

  return User.findOne({
    $or: [{ tutorId: tutor.id }, { email: tutor.email }],
  });
};

const syncUserFromTutor = async (tutor) => {
  if (!shouldSyncTutorToUser(tutor)) {
    return null;
  }

  const existingUser = await getTutorLinkedUser(tutor);

  if (existingUser && existingUser.tutorId && existingUser.tutorId.toString() !== tutor.id) {
    throw new ApiError(httpStatus.CONFLICT, 'A different tutor is already linked to this user email');
  }

  const userPayload = {
    email: tutor.email,
    password: tutor.password,
    name: tutor.fullName,
    role: 'tutor',
    phoneNumber: tutor.contactNumber,
    status: tutor.status,
    tutorId: tutor._id,
  };

  let user;
  if (existingUser) {
    Object.assign(existingUser, userPayload);
    await User.updateOne({ _id: existingUser._id }, { $set: userPayload }, { runValidators: true });
    user = await User.findById(existingUser._id);
  } else {
    user = await User.findOneAndUpdate(
      { email: tutor.email },
      { $setOnInsert: userPayload },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
  }

  if (!tutor.userId || tutor.userId.toString() !== user.id) {
    await Tutor.updateOne({ _id: tutor._id }, { $set: { userId: user._id } }, { runValidators: true });
  }

  return user;
};

const getUserLinkedTutor = async (user) => {
  if (user.tutorId) {
    return Tutor.findById(user.tutorId);
  }

  if (user.role === 'tutor') {
    return Tutor.findOne({
      $or: [{ userId: user.id }, { email: user.email }],
    });
  }

  return null;
};

const syncTutorFromUser = async (user) => {
  const tutor = await getUserLinkedTutor(user);
  if (!tutor) {
    return null;
  }

  const tutorPayload = {
    email: user.email,
    password: user.password,
    fullName: user.name,
    contactNumber: user.phoneNumber,
    status: getTutorStatusFromUser(user.status),
    userId: user._id,
    dateOfBirth: user.birthday ? new Date(user.birthday) : undefined,
    gender: user.gender,
    age: user.age,
    nationality: user.nationality,
    race: user.race,
    tutoringLevels: user.tutoringLevels,
    preferredLocations: user.preferredLocations,
    tutorMediums: user.tutorMediums,
    grades: user.grades,
    subjects: user.subjects,
    tutorType: user.tutorType,
    highestEducation: user.highestEducation,
    yearsExperience: user.yearsExperience,
    academicDetails: user.academicDetails,
    certificatesAndQualifications: getTutorCertificatesFromUser(user, tutor),
    language: user.language,
    timeZone: user.timeZone,
    rate: user.rate,
    availability: user.availability,
  };

  await Tutor.updateOne({ _id: tutor._id }, { $set: removeUndefinedValues(tutorPayload) }, { runValidators: true });

  if (!user.tutorId || user.tutorId.toString() !== tutor.id) {
    await User.updateOne({ _id: user._id }, { $set: { tutorId: tutor._id } }, { runValidators: true });
  }

  return Tutor.findById(tutor._id);
};

module.exports = {
  syncUserFromTutor,
  syncTutorFromUser,
};
