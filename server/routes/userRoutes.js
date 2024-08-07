// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Document = require('../models/document');
const upload = require('../config/multerConfig');
const path = require('path');

// Create a new user profile with document upload
router.post('/', upload.single('document'), async (req, res) => {
  try {
    // Create the document
    let documentId = null;
    if (req.file) {
      const document = new Document({
        title: req.body.title || req.file.originalname,
        content: req.file.path
      });
      const savedDocument = await document.save();
      documentId = savedDocument._id;
    }

    // Create the user profile
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      documents: documentId ? [documentId] : []
    });
    await user.save();

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Upload a document
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Create a new document entry
    const document = new Document({
      title: req.body.title || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      content: req.file.path
    });
    await document.save();
    
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all user profiles
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('documents');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('documents');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile and optionally upload a new document
router.put('/:id', upload.single('document'), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user profile fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    let documentId = null;
    if (req.file) {
      // Create or update document
      const document = new Document({
        title: req.body.title || req.file.originalname,
        content: req.file.path
      });
      const savedDocument = await document.save();
      documentId = savedDocument._id;

      // Update user's document references
      user.documents.push(documentId);
    }

    // Save updated user profile
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a user profile
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
