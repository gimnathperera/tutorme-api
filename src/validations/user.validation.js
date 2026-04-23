const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { parseAvailabilityInput } = require('../utils/availability');

const availabilityField = Joi.alternatives()
  .try(
    Joi.string(),
    Joi.array().items(
      Joi.object({
        day: Joi.string().required(),
        start: Joi.string().required(),
        end: Joi.string().required(),
      })
    )
  )
  .custom((value, helpers) => {
    try {
      return parseAvailabilityInput(value);
    } catch (error) {
      return helpers.message(error.message);
    }
  }, 'availability normalization');

const nationalityField = Joi.string().valid('Sri Lankan', 'Others');
const raceField = Joi.string().valid('Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others');
const tutoringLevelsField = Joi.array().items(
  Joi.string().valid(
    'Pre-School / Montessori',
    'Primary School (Grades 1-5)',
    'Ordinary Level (O/L) (Grades 6-11)',
    'Advanced Level (A/L) (Grades 12-13)',
    'International Syllabus (Cambridge, Edexcel, IB)',
    'Undergraduate',
    'Diploma / Degree',
    'Language (e.g., English, French, Japanese)',
    'Computing (e.g., Programming, Graphic Design)',
    'Music & Arts',
    'Special Skills'
  )
);
const preferredLocationsField = Joi.array().items(
  Joi.string().valid(
    'Kollupitiya (Colombo 3)',
    'Bambalapitiya (Colombo 4)',
    'Havelock Town (Colombo 5)',
    'Wellawatte (Colombo 6)',
    'Cinnamon Gardens (Colombo 7)',
    'Borella (Colombo 8)',
    'Dehiwala',
    'Mount Lavinia',
    'Nugegoda',
    'Rajagiriya',
    'Kotte',
    'Battaramulla',
    'Malabe',
    'Moratuwa',
    'Gampaha',
    'Negombo',
    'Kadawatha',
    'Kiribathgoda',
    'Kelaniya',
    'Wattala',
    'Ja-Ela',
    'Kalutara',
    'Panadura',
    'Horana',
    'Wadduwa',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Kurunegala',
    'Puttalam',
    'Chilaw',
    'Ratnapura',
    'Kegalle',
    'Badulla',
    'Bandarawela',
    'Anuradhapura',
    'Polonnaruwa',
    'Jaffna',
    'Vavuniya',
    'Trincomalee',
    'Batticaloa',
    'No Preference'
  )
);
const tutorMediumsField = Joi.array().items(Joi.string().valid('Sinhala', 'English', 'Tamil'));
const tutorTypeField = Joi.array().items(
  Joi.string().valid('Full-Time', 'Part-Time', 'Online', 'School Teacher Tutors', 'Group Tutors', 'Exam Coaches')
);
const highestEducationField = Joi.string().valid(
  'PhD',
  'Masters',
  'Bachelor Degree',
  'Undergraduate',
  'Diploma and Professional',
  'AL'
);
const academicDetailsField = Joi.string().max(500);
const certificatesAndQualificationsField = Joi.array().items(Joi.string());

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    role: Joi.string().required().valid('user', 'tutor', 'admin'),
    phoneNumber: Joi.string().required(),
    status: Joi.string().optional(),
    country: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    region: Joi.string().optional(),
    zip: Joi.string().optional(),
    address: Joi.string().optional(),
    birthday: Joi.date().required(),
    age: Joi.number().integer().min(0).max(120).optional(),
    nationality: nationalityField.optional(),
    race: raceField.optional(),
    tutoringLevels: tutoringLevelsField.optional(),
    preferredLocations: preferredLocationsField.optional(),
    tutorMediums: tutorMediumsField.optional(),
    tutorType: Joi.alternatives().try(Joi.valid('part-time', 'full-time', 'gov'), tutorTypeField).optional(),
    highestEducation: highestEducationField.optional(),
    yearsExperience: Joi.number().integer().min(0).max(50).optional(),
    academicDetails: academicDetailsField.optional(),
    certificatesAndQualifications: certificatesAndQualificationsField.optional(),
    gender: Joi.string().optional(),
    duration: Joi.string().optional(),
    frequency: Joi.string().optional(),
    timeZone: Joi.string().optional(),
    language: Joi.string().optional(),
    avatar: Joi.string().optional(),
    rate: Joi.string().optional(),
    availability: availabilityField.optional(),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      name: Joi.string(),
      phoneNumber: Joi.string(),
      status: Joi.valid('active', 'inactive', 'blocked'),
      country: Joi.string(),
      role: Joi.string().valid('user', 'tutor', 'admin'),
      city: Joi.string(),
      state: Joi.string(),
      region: Joi.string(),
      zip: Joi.string(),
      address: Joi.string(),
      birthday: Joi.date(),
      age: Joi.number().integer().min(0).max(120),
      nationality: nationalityField,
      race: raceField,
      tutoringLevels: tutoringLevelsField,
      preferredLocations: preferredLocationsField,
      tutorMediums: tutorMediumsField,
      tutorType: Joi.alternatives().try(Joi.valid('part-time', 'full-time', 'gov'), tutorTypeField),
      highestEducation: highestEducationField,
      yearsExperience: Joi.number().integer().min(0).max(50),
      academicDetails: academicDetailsField,
      certificatesAndQualifications: certificatesAndQualificationsField,
      gender: Joi.string(),
      duration: Joi.string(),
      frequency: Joi.string(),
      grades: Joi.optional(),
      subjects: Joi.optional(),
      timeZone: Joi.string(),
      language: Joi.string(),
      avatar: Joi.string(),
      rate: Joi.string(),
      availability: availabilityField,
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const changePassword = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      currentPassword: Joi.string().custom(password),
      newPassword: Joi.string().custom(password),
    })
    .min(1),
};

const generateTempPassword = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
  generateTempPassword,
};
