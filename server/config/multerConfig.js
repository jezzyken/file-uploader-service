// config/multerConfig.js
const multer = require('multer');
const path = require('path');

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // File name
  }
});

// Create multer instance
const upload = multer({ storage: storage });

module.exports = upload;
