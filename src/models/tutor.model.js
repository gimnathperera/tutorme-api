const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      private: true,
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
      enum: ['Sri Lankan', 'Others'],
      required: true,
    },
    race: {
      type: String,
      enum: ['Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Others'],
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    classType: [
      {
        type: String,
        enum: ['Online - Individual', 'Online - Group', 'In-Person - Individual', 'In-Person - Group'],
      },
    ],

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
        required: true,
      },
    ],
    tutorMediums: {
      type: [String],
      enum: ['Sinhala', 'English', 'Tamil'],
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    grades: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
      },
    ],

    tutorType: [
      {
        type: String,
        enum: [
          'Private Tutor',
          'Government Teacher',
          'International School Teacher',
          'University Lecturer',
          'Full-Time',
          'Part-Time',
          'Online',
          'School Teacher Tutors',
          'Group Tutors',
          'Exam Coaches',
        ],
        required: true,
      },
    ],

    yearsExperience: {
      type: Number,
      min: 0,
      max: 50,
      required: true,
    },
    highestEducation: {
      type: String,
      enum: ['PhD', 'Masters', 'Bachelor Degree', 'Undergraduate', 'Diploma and Professional', 'AL'],
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
    certificatesAndQualifications: [
      {
        type: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
tutorSchema.pre('save', async function (next) {
  const tutor = this;
  if (tutor.isModified('password')) {
    tutor.password = await bcrypt.hash(tutor.password, 8);
  }
  next();
});

/**
 * Check if password matches the stored hashed password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
tutorSchema.methods.isPasswordMatch = async function (password) {
  const tutor = this;
  return bcrypt.compare(password, tutor.password);
};

tutorSchema.plugin(toJSON);
tutorSchema.plugin(paginate);

const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
