const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const tuitionAssignmentSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assignmentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grade',
      required: true,
    },
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true,
    },
    assignmentPrice: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

tuitionAssignmentSchema.plugin(toJSON);
tuitionAssignmentSchema.plugin(paginate);

const TuitionAssignment = mongoose.model('TuitionAssignment', tuitionAssignmentSchema);
module.exports = TuitionAssignment;
