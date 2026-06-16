const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const refereeSchema = mongoose.Schema(
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
      unique: true,
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    referralCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

refereeSchema.plugin(toJSON);
refereeSchema.plugin(paginate);

const Referee = mongoose.model('Referee', refereeSchema);

module.exports = Referee;
