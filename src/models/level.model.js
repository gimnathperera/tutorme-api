const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const levelSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    details: {
      type: [String],
      required: true,
    },
    challanges: {
      type: [String],
      required: true,
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
levelSchema.plugin(toJSON);
levelSchema.plugin(paginate);

/**
 * Check if title is taken
 * @param {string} title - The level's title
 * @param {ObjectId} [excludedLevelId] - The id of the level to be excluded
 * @returns {Promise<boolean>}
 */
levelSchema.statics.isTitleTaken = async function (title, excludedLevelId) {
  const level = await this.findOne({ title, _id: { $ne: excludedLevelId } });
  return !!level;
};

/**
 * @typedef Level
 */
const Level = mongoose.model('Level', levelSchema);

module.exports = Level;
