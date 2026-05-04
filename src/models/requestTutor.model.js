const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const {
  tutorTypes,
  tutorMediums,
  requestTutorClassTypes,
  requestTutorStatuses,
  sessionDurations,
  sessionFrequencies,
} = require('../config/enums');

const requestTutorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    grade: {
      type: String,
      required: true,
      trim: true,
    },
    medium: {
      type: String,
      enum: tutorMediums,
      required: true,
    },
    status: {
      type: String,
      enum: requestTutorStatuses,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    tutors: [
      {
        subject: {
          type: String,
          required: true,
          trim: true,
        },
        assignedTutor: {
          type: String,
          trim: true,
          default: null,
        },
        preferredTutorType: {
          type: String,
          enum: tutorTypes,
          required: true,
        },
        preferredClassType: {
          type: String,
          enum: requestTutorClassTypes,
          required: true,
        },
        duration: {
          type: String,
          enum: sessionDurations,
          required: true,
        },
        frequency: {
          type: String,
          enum: sessionFrequencies,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

requestTutorSchema.plugin(toJSON);
requestTutorSchema.plugin(paginate);

const RequestTutor = mongoose.model('RequestTutor', requestTutorSchema);

module.exports = RequestTutor;
