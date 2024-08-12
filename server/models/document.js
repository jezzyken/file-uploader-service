// models/document.js
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: String,
  content: String,
  isTemporary: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Document', documentSchema);
