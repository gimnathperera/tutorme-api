const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

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
    grade: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
      },
    ],
    medium: {
      type: String,
      enum: ['Sinhala', 'English', 'Tamil'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Tutor Assigned'],
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    tutors: [
      {
        _id: false,
        subjects: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
          },
        ],
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
        assignedTutor: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tutor',
          },
        ],
        preferredTutorType: {
          type: String,
          enum: ['Part Time Tutors', 'Full Time Tutors', 'Ex / Current Government School Tutors'],
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
