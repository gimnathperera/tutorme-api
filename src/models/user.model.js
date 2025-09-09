const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles } = require('../config/roles');
const { userStatus, tutorTypes } = require('../config/users');

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
    forcePasswordReset: {
      type: Boolean,
      default: false,
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
        if (!validator.isMobilePhone(value)) {
          throw new Error('Invalid phone number');
        }
      },
    },
    status: {
      type: String,
      enum: [userStatus.ACTIVE, userStatus.INACTIVE, userStatus.BLOCKED],
      default: userStatus.ACTIVE,
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
    tutorType: {
      type: String,
      enum: [tutorTypes.FULL_TIME, tutorTypes.PART_TIME, tutorTypes.GOV],
      trim: true,
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
    avatar: {
      type: String,
      trim: true,
    },
    timeZone: {
      type: String,
      trim: true,
      default: 'UTC+5:30',
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
