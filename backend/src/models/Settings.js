const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['general', 'notification', 'security', 'email', 'project', 'ui'],
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    label: { type: String, trim: true },
    description: { type: String, trim: true },
    isPublic: { type: Boolean, default: false },
    isEditable: { type: Boolean, default: true },
    dataType: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      default: 'string',
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });

// Static: get value by key
settingsSchema.statics.getValue = async function (key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

// Static: set value by key
settingsSchema.statics.setValue = async function (key, value, userId = null) {
  return this.findOneAndUpdate(
    { key },
    { value, updatedBy: userId },
    { new: true, upsert: true, runValidators: true }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
