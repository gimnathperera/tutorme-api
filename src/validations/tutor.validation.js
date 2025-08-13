const Joi = require('joi');
const mongoose = require('mongoose');

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
    confirmContactNumber: Joi.any().valid(Joi.ref('contactNumber')).required().messages({
      'any.only': 'Contact numbers do not match',
      'any.required': 'Confirm Contact Number is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be valid',
      'string.empty': 'Email is required',
    }),
    dateOfBirth: Joi.string().isoDate().required().messages({
      'string.isoDate': 'Date of Birth must be in ISO format (YYYY-MM-DD)',
      'any.required': 'Date of Birth is required',
    }),
    confirmDateOfBirth: Joi.string()
      .isoDate()
      .required()
      .custom((value, helpers) => {
        const dob = helpers.state.ancestors[0].dateOfBirth;
        if (value !== dob) {
          return helpers.message('Date of Birth entries do not match');
        }
        return value;
      }),
    gender: Joi.string().valid('Male', 'Female').required().messages({
      'any.only': 'Gender must be Male or Female',
      'any.required': 'Gender is required',
    }),
    age: Joi.number().integer().min(1).required().messages({
      'number.base': 'Age must be a number',
      'any.required': 'Age is required',
    }),
    nationality: Joi.string().valid('Singaporean', 'Singapore PR', 'Others').required(),
    race: Joi.string().valid('Chinese', 'Malay', 'Indian', 'Eurasian', 'Caucasian', 'Punjabi', 'Others').required(),
    last4NRIC: Joi.string()
      .length(4)
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.length': 'Last 4 digits of NRIC must be exactly 4 digits',
        'string.pattern.base': 'Last 4 digits of NRIC must be numbers',
      }),

    // 2. Tutoring Preferences
    tutoringLevels: Joi.array()
      .items(
        Joi.string().valid(
          'Pre-School',
          'Primary School',
          'Lower Secondary',
          'Upper Secondary',
          'Junior College',
          'IB/IGCSE',
          'Diploma / Degree',
          'Language',
          'Computing',
          'Special Skills',
          'Music'
        )
      )
      .min(1)
      .required(),
    preferredLocations: Joi.array()
      .items(
        Joi.string().valid(
          // List all locations
          'Admiralty',
          'Ang Mo Kio',
          'Bishan',
          'Boon Lay',
          'Bukit Batok',
          'Bukit Panjang',
          'Choa Chu Kang',
          'Clementi',
          'Jurong East',
          'Jurong West',
          'Kranji',
          'Marsiling',
          'Sembawang',
          'Sengkang',
          'Woodlands',
          'Yew Tee',
          'Yishun',
          'Bedok',
          'Changi',
          'East Coast',
          'Geylang',
          'Hougang',
          'Katong',
          'Marine Parade',
          'Pasir Ris',
          'Punggol',
          'Serangoon',
          'Tampines',
          'Ubi',
          'Boon Lay',
          'Bukit Merah',
          'Bukit Timah',
          'Dover',
          'Holland Village',
          'Newton',
          'Queenstown',
          'Toa Payoh',
          'West Coast',
          'Boat Quay',
          'Bugis',
          'Chinatown',
          'City Hall',
          'Clarke Quay',
          'Dhoby Ghaut',
          'Marina Bay',
          'Orchard',
          'Raffles Place',
          'Robertson Quay',
          'Tanjong Pagar',
          'Bukit Panjang',
          'Hillview',
          'Keat Hong',
          'Teck Whye',
          'Ang Mo Kio',
          'Balestier',
          'Bras Basah',
          'Farrer Park',
          'Kallang',
          'Lavender',
          'Little India',
          'MacPherson',
          'Novena',
          'Potong Pasir',
          'Rochor',
          'Thomson',
          'No Preference'
        )
      )
      .min(1)
      .required(),

    // 3. Academic Qualifications & Experience
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

    // 5. Agreement & Submit
    agreeTerms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must agree to Terms and Conditions',
    }),
    agreeAssignmentInfo: Joi.boolean().valid(true).required(),

    captchaToken: Joi.string().required().messages({
      'string.empty': 'reCAPTCHA verification is required',
    }),
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
      fullName: Joi.string(),
      contactNumber: Joi.string().pattern(/^\d+$/).min(7).max(15),
      email: Joi.string().email(),
      gender: Joi.string().valid('Male', 'Female'),
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

module.exports = {
  createTutor,
  getTutors,
  getTutor,
  updateTutor,
  deleteTutor,
};
