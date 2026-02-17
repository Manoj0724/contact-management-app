const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  title: { 
    type: String, 
    enum: ['Mr', 'Mrs', 'Ms', 'Dr'], 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  mobile1: { 
    type: String, 
    required: true 
  },
  mobile2: { 
    type: String 
  },
  address: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  favoritedAt: { 
    type: Date 
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Contact', contactSchema);