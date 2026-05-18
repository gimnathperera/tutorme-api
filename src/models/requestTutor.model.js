const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { requestTutorStatuses } = require('../config/enums');

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
      enum: ['Sinhala', 'English', 'Tamil'],
      required: true,
    },
    status: {
      type: String,
      enum: requestTutorStatuses,
      required: true,
      default: 'Pending',
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    telegramOutreachSentAt: {
      type: Date,
      default: null,
    },
    telegramOutreachSentBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      default: null,
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
          required: true,
        },
        preferredClassType: {
          type: String,
          enum: ['Online - Individual', 'Online - Group', 'Physical - Individual', 'Physical - Group'],
          required: true,
        },
        duration: {
          type: String,
          enum: ['30 Minutes', 'One Hour', 'Two Hours'],
          required: true,
        },
        frequency: {
          type: String,
          enum: ['Once a Week', 'Twice a Week', 'Daily'],
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
