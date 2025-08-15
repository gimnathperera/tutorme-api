const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tutorSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    contactNumber: {
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
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    nationality: {
      type: String,
      enum: ['Singaporean', 'Singapore PR', 'Others'],
      required: true,
    },
    race: {
      type: String,
      enum: ['Chinese', 'Malay', 'Indian', 'Eurasian', 'Caucasian', 'Punjabi', 'Others'],
      required: true,
    },
    last4NRIC: {
      type: String,
      required: true,
      length: 4,
    },

    tutoringLevels: [
      {
        type: String,
        enum: [
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
          'Music',
        ],
        required: true,
      },
    ],

    preferredLocations: [
      {
        type: String,
        enum: [
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
          'No Preference',
        ],
        required: true,
      },
    ],

    tutorType: {
      type: String,
      enum: [
        'Full Time Student',
        'Undergraduate',
        'Part Time Tutor',
        'Full Time Tutor',
        'Ex/Current MOE Teacher',
        'Ex-MOE Teacher',
        'Current MOE Teacher',
      ],
      required: true,
    },
    yearsExperience: {
      type: Number,
      min: 0,
      max: 50,
      required: true,
    },
    highestEducation: {
      type: String,
      enum: [
        'PhD',
        'Diploma',
        'Masters',
        'Undergraduate',
        'Bachelor Degree',
        'Diploma and Professional',
        'JC/A Levels',
        'Poly',
        'Others',
      ],
      required: true,
    },
    academicDetails: {
      type: String,
      maxlength: 1000,
      default: '',
    },

    teachingSummary: {
      type: String,
      maxlength: 750,
      required: true,
    },
    studentResults: {
      type: String,
      maxlength: 750,
      required: true,
    },
    sellingPoints: {
      type: String,
      maxlength: 750,
      required: true,
    },

    agreeTerms: {
      type: Boolean,
      required: true,
      default: false,
    },
    agreeAssignmentInfo: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

tutorSchema.plugin(toJSON);
tutorSchema.plugin(paginate);

const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
