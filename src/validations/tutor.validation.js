const Joi = require('joi');
const mongoose = require('mongoose');
const { password, objectId } = require('./custom.validation');

const createTutor = {
  body: Joi.object().keys({
    // 1. Personal Information
    fullName: Joi.string().required().messages({
      'string.empty': 'Full Name is required',
    }),
    contactNumber: Joi.string().pattern(/^\d+$/).min(7).max(15).required().messages({
      'string.pattern.base': 'Contact Number must be digits only',
      'string.empty': 'Contact Number is required',
    }),

    email: Joi.string().email().required().messages({
      'string.email': 'Email must be valid',
      'string.empty': 'Email is required',
    }),
    dateOfBirth: Joi.string().isoDate().required().messages({
      'string.isoDate': 'Date of Birth must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Date of Birth is required',
    }),

    gender: Joi.string().valid('Male', 'Female').required().messages({
      'any.only': 'Gender must be Male or Female',
      'any.required': 'Gender is required',
    }),
    age: Joi.number().integer().min(1).required().messages({
      'number.base': 'Age must be a number',
      'any.required': 'Age is required',
    }),
    nationality: Joi.string().valid('Sri Lankan', 'Others').required(),
    race: Joi.string().valid('Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others').required(),

    // 2. Tutoring Preferences
    tutoringLevels: Joi.array()
      .items(
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
      )
      .min(1)
      .required(),
    preferredLocations: Joi.array()
      .items(
        Joi.string().valid(
          // List all locations
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
      )
      .min(1)
      .required(),

    // 3. Academic Qualifications & Experience
    tutorMediums: Joi.array().items(Joi.string().valid('Sinhala', 'English', 'Tamil')).min(1).required().messages({
      'array.min': 'Please select at least one medium.',
    }),

    grades: Joi.array().items(Joi.string()).min(1).required(),
    subjects: Joi.array().items(Joi.string()).min(1).required(),

    tutorType: Joi.string()
      .valid(
        'Full Time Student',
        'Undergraduate',
        'Part Time Tutor',
        'Full Time Tutor',
        'Ex/Current MOE Teacher',
        'Ex-MOE Teacher',
        'Current MOE Teacher'
      )
      .required(),
    yearsExperience: Joi.number().integer().min(0).max(50).required(),
    highestEducation: Joi.string()
      .valid(
        'PhD',
        'Diploma',
        'Masters',
        'Undergraduate',
        'Bachelor Degree',
        'Diploma and Professional',
        'JC/A Levels',
        'Poly',
        'Others'
      )
      .required(),
    academicDetails: Joi.string().allow('').max(1000),

    // 4. Tutor's Profile
    teachingSummary: Joi.string().max(750).required(),
    studentResults: Joi.string().max(750).required(),
    sellingPoints: Joi.string().max(750).required(),
    certificatesAndQualifications: Joi.array().items(Joi.string().trim().min(3)).min(1).required().messages({
      'array.base': 'Certificates and qualifications must be an array',
      'array.min': 'At least one certificate or qualification is required',
      'string.min': 'Certificate name must be at least 3 characters long',
    }),

    // 5. Agreement & Submit
    agreeTerms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must agree to Terms and Conditions',
    }),
    agreeAssignmentInfo: Joi.boolean().valid(true).required(),
  }),
};

const getTutors = {
  query: Joi.object().keys({}),
};

const getTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const updateTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
  body: Joi.object()
    .keys({
      // 1. Personal Information
      fullName: Joi.string(),
      contactNumber: Joi.string().pattern(/^\d+$/).min(7).max(15),
      email: Joi.string().email(),
      dateOfBirth: Joi.string().isoDate(),
      gender: Joi.string().valid('Male', 'Female'),
      age: Joi.number().integer().min(1),
      nationality: Joi.string().valid('Sri Lankan', 'Others'),
      race: Joi.string().valid('Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others'),

      tutorMediums: Joi.array().items(Joi.string().valid('Sinhala', 'English', 'Tamil')).min(1),
      grades: Joi.array().items(Joi.string()),
      subjects: Joi.array().items(Joi.string()),

      // 2. Tutoring Preferences
      tutoringLevels: Joi.array().items(
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
      ),

      preferredLocations: Joi.array().items(
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
      ),

      // 3. Academic Qualifications & Experience
      tutorType: Joi.string(),
      yearsExperience: Joi.number().integer().min(0).max(50),
      highestEducation: Joi.string().valid(
        'PhD',
        'Diploma',
        'Masters',
        'Undergraduate',
        'Bachelor Degree',
        'Diploma and Professional',
        'JC/A Levels',
        'Poly',
        'Others'
      ),
      academicDetails: Joi.string().allow('').max(1000),

      // 4. Tutor's Profile
      teachingSummary: Joi.string().max(750),
      studentResults: Joi.string().max(750),
      sellingPoints: Joi.string().max(750),
      certificatesAndQualifications: Joi.array(),

      // 5. Agreement & Submit
      agreeTerms: Joi.boolean(),
      agreeAssignmentInfo: Joi.boolean(),
    })
    .min(1),
};

const deleteTutor = {
  params: Joi.object().keys({
    tutorId: Joi.string().custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message('Invalid tutor ID');
      }
      return value;
    }),
  }),
};

const changePassword = {
  params: Joi.object().keys({
    tutorId: Joi.required().custom(objectId),
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
    tutorId: Joi.string().required().custom(objectId),
  }),
};

const matchTutorsBySubjects = {
  body: Joi.object().keys({
    subjects: Joi.array().items(Joi.string().custom(objectId)).min(1).required(),

    tutorType: Joi.string().optional(),
  }),
};

module.exports = {
  createTutor,
  getTutors,
  getTutor,
  updateTutor,
  deleteTutor,
  changePassword,
  generateTempPassword,
  matchTutorsBySubjects,
};
