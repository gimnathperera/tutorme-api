const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { requestStatus } = require('../config/tutor');
const { tutorTypes } = require('../config/users');

const personalInfoSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    grade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zip: {
      type: String,
      required: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const lessonDetailsSchema = new mongoose.Schema(
  {
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    duration: {
      type: String,
      required: true,
    },
    frequency: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const lessonInfoSchema = new mongoose.Schema(
  {
    tutorCount: {
      type: String,
      required: true,
    },
    lessonDetails: [
      {
        type: lessonDetailsSchema,
        required: true,
      },
    ],
  },
  { _id: false }
);

const tutorTypeSchema = new mongoose.Schema(
  {
    tutorType: {
      type: String,
      enum: [tutorTypes.FULL_TIME, tutorTypes.PART_TIME, tutorTypes.GOV],
      trim: true,
    },
    studentSchool: {
      type: String,
      trim: true,
      required: true,
    },
    genderPreference: {
      type: String,
      trim: true,
      required: true,
    },
    isBilingualTutor: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const tutorSchema = mongoose.Schema(
  {
    status: {
      type: String,
      enum: [requestStatus.SUBMITTED, requestStatus.IN_PROGRESS, requestStatus.REJECTED, requestStatus.RESOLVED],
      trim: true,
      default: requestStatus.SUBMITTED,
    },

    personalInfo: {
      type: personalInfoSchema,
      required: true,
    },
    lessonInfo: {
      type: lessonInfoSchema,
      required: true,
    },
    tutorTypeInfo: {
      type: tutorTypeSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tutorSchema.plugin(toJSON);
tutorSchema.plugin(paginate);

/**
 * @typedef Tutor
 */
const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
