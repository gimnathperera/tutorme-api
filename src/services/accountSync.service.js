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
  if (!Array.isArray(user.certificatesAndQualifications) || user.certificatesAndQualifications.length === 0) {
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

const getUserCertificatesFromTutor = (tutor) => {
  if (!Array.isArray(tutor.certificatesAndQualifications)) {
    return undefined;
  }

  return tutor.certificatesAndQualifications
    .map((certificate) => (typeof certificate === 'string' ? certificate : certificate.url))
    .filter(Boolean);
};

const removeUndefinedValues = (payload) =>
  Object.entries(payload).reduce((cleanPayload, [key, value]) => {
    if (value !== undefined) {
      return { ...cleanPayload, [key]: value };
    }

    return cleanPayload;
  }, {});

const getFilledArray = (value) => (Array.isArray(value) && value.length > 0 ? value : undefined);

const getFilledString = (value) => (typeof value === 'string' && value.trim().length > 0 ? value : undefined);

const hasOnlineClassType = (classType) =>
  Array.isArray(classType) && classType.some((type) => typeof type === 'string' && type.startsWith('Online'));

const getPreferredLocationsFromUser = (user) => {
  if (!Array.isArray(user.preferredLocations)) {
    return undefined;
  }

  if (user.preferredLocations.length > 0 || hasOnlineClassType(user.classType)) {
    return user.preferredLocations;
  }

  return undefined;
};

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
    birthday: tutor.dateOfBirth,
    age: tutor.age,
    gender: tutor.gender,
    nationality: tutor.nationality,
    race: tutor.race,
    classType: tutor.classType,
    tutoringLevels: tutor.tutoringLevels,
    preferredLocations: tutor.preferredLocations,
    tutorMediums: tutor.tutorMediums,
    grades: tutor.grades,
    subjects: tutor.subjects,
    tutorType: tutor.tutorType,
    highestEducation: tutor.highestEducation,
    yearsExperience: tutor.yearsExperience,
    academicDetails: tutor.academicDetails,
    teachingSummary: tutor.teachingSummary,
    studentResults: tutor.studentResults,
    sellingPoints: tutor.sellingPoints,
    certificatesAndQualifications: getUserCertificatesFromTutor(tutor),
    language: tutor.language,
    timeZone: tutor.timeZone,
    rate: tutor.rate,
    availability: tutor.availability,
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
    classType: getFilledArray(user.classType),
    tutoringLevels: getFilledArray(user.tutoringLevels),
    preferredLocations: getPreferredLocationsFromUser(user),
    tutorMediums: getFilledArray(user.tutorMediums),
    grades: getFilledArray(user.grades),
    subjects: getFilledArray(user.subjects),
    tutorType: getFilledArray(user.tutorType),
    highestEducation: user.highestEducation,
    yearsExperience: user.yearsExperience,
    academicDetails: getFilledString(user.academicDetails),
    teachingSummary: getFilledString(user.teachingSummary),
    studentResults: getFilledString(user.studentResults),
    sellingPoints: getFilledString(user.sellingPoints),
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
