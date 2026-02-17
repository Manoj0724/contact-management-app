const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: 'label'
  },
  userId: {
    type: String,
    default: 'default-user'
  }
}, {
  timestamps: true
});

groupSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Group', groupSchema);