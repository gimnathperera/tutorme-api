const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { userStatus } = require('../config/users');
const { WEEK_DAYS, TIME_PATTERN, toMinutes } = require('../utils/availability');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: WEEK_DAYS,
      required: true,
      trim: true,
    },
    start: {
      type: String,
      required: true,
      trim: true,
      match: TIME_PATTERN,
    },
    end: {
      type: String,
      required: true,
      trim: true,
      match: TIME_PATTERN,
      validate: {
        validator(value) {
          return typeof this.start === 'string' && toMinutes(value) > toMinutes(this.start);
        },
        message: 'Availability end time must be later than start time',
      },
    },
  },
  {
    _id: false,
    id: false,
  }
);

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    phoneNumber: {
      type: String,
      trim: true,
      validate(value) {
        if (!/^\+?\d{1,15}$/.test(value)) {
          throw new Error('Invalid phone number');
        }
      },
    },
    status: {
      type: String,
      enum: Object.values(userStatus),
      default: userStatus.PENDING,
      required: true,
    },
    country: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    forcePasswordReset: {
      type: Boolean,
      default: false,
    },

    zip: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    birthday: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    nationality: {
      type: String,
      enum: ['Sri Lankan', 'Others'],
      trim: true,
    },
    race: {
      type: String,
      enum: ['Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others'],
      trim: true,
    },
    tutoringLevels: [
      {
        type: String,
        enum: [
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
          'Special Skills',
        ],
      },
    ],
    preferredLocations: [
      {
        type: String,
        enum: [
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
          'No Preference',
        ],
      },
    ],
    tutorType: {
      type: [
        {
          type: String,
          enum: [
            'Private Tutor',
            'Government Teacher',
            'University Student',
            'Coach',
            'International School Teacher',
            'University Lecturer',
            'Online Tutor',
            'Others',
            'Full-Time',
            'Part-Time',
            'Online',
            'School Teacher Tutors',
            'Group Tutors',
            'Exam Coaches',
          ],
          trim: true,
        },
      ],
      default: undefined,
    },
    highestEducation: {
      type: String,
      enum: ['PhD', 'Masters', 'Bachelor Degree', 'Undergraduate', 'Diploma and Professional', 'AL'],
      trim: true,
    },
    yearsExperience: {
      type: Number,
      min: 0,
      max: 50,
    },
    academicDetails: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    certificatesAndQualifications: {
      type: [String],
      default: [],
    },
    gender: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    frequency: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    grades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    language: {
      type: String,
      trim: true,
      default: 'en',
    },
    tutorMediums: {
      type: [String],
      enum: ['Sinhala', 'English', 'Tamil'],
      default: undefined,
    },
    avatar: {
      type: String,
      trim: true,
    },
    rate: {
      type: String,
      trim: true,
      default: '',
    },
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },
    timeZone: {
      type: String,
      trim: true,
      default: 'UTC+5:30',
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      index: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
