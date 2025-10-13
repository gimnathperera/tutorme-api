const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const requestTutorSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
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
    grade: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
      },
    ],
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
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
      },
    ],
    preferredTutorType: {
      type: String,
      enum: ['Part Time Tutors', 'Full Time Tutors', 'Ex / Current Government School Tutors'],
      required: true,
    },
    studentSchool: { type: String, required: true, trim: true },
    genderPreference: { type: String, enum: ['Male', 'Female', 'Others'], required: true },
    bilingual: {
      type: String,
      enum: ['Yes', 'No'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

requestTutorSchema.plugin(toJSON);
requestTutorSchema.plugin(paginate);

const RequestTutor = mongoose.model('RequestTutor', requestTutorSchema);

module.exports = RequestTutor;
