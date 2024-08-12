const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Document = require("../models/document");
const upload = require("../config/multerConfig");
const path = require("path");
const fs = require("fs");
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const uploadx = multer({ storage: storage });

// router.post("/", async (req, res) => {
//   console.log(req.body);
//   try {
//     const user = new User({
//       name: req.body.name,
//       email: req.body.email,
//       documents: req.body.documentUrl ? [req.body.documentUrl] : [],
//     });
//     await user.save();

//     res.status(201).json(user);
//   } catch (error) {
//     console.log(error);
//     res.status(400).json({ error: error.message });
//   }
// });
router.post('/', async (req, res) => {
  try {
    console.log('Session tempFile:', req.session);

    return

    const user = new User({
      name: req.body.name,
      email: req.body.email,
    });

    await user.save();

    if (req.session.tempFile) {
      // Save the file to disk
      const filename = `${Date.now()}-${req.session.tempFile.originalname}`;
      const filePath = path.join(__dirname, '../uploads', filename); // Adjust the path as needed
      fs.writeFileSync(filePath, req.session.tempFile.buffer);

      // Create a document entry in the database
      const document = new Document({
        title: req.session.tempFile.originalname,
        content: filePath,
      });
      await document.save();

      // Associate the document with the user
      user.documents.push(document._id);
      await user.save();

      // Clear the temp file from the session
      req.session.tempFile = null;
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



router.post("/upload", upload.single("document"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const document = new Document({
      title:
        req.body.title ||
        path.basename(
          req.file.originalname,
          path.extname(req.file.originalname)
        ),
      content: req.file.path,
    });
    const savedDocument = await document.save();

    res.status(201).json(savedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// router.post(
//   "/documents/temp-upload",
//   upload.single("document"),
//   async (req, res) => {
//     try {
//       if (!req.file)
//         return res.status(400).json({ message: "No file uploaded" });

//       const document = new Document({
//         title: req.body.title || req.file.originalname,
//         content: req.file.path,
//         isTemporary: true,
//       });
//       const savedDocument = await document.save();

//       res.status(201).json({
//         _id: savedDocument._id,
//         tempFileUrl: req.file.path,
//         filename: req.file.filename,
//       });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

router.post('/documents/temp-upload', uploadx.single('document'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Log the session before setting tempFile

    req.session.tempFile = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      res.status(201).json({ message: 'File uploaded temporarily' });
    });

    console.log('Session before setting tempFile:', req.session);


    // Log the session after setting tempFile
    // console.log('Session after setting tempFile:', req.session);

    // res.status(201).json({ message: 'File uploaded temporarily' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const users = await User.find().populate("documents");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("documents");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.documentId) {
      user.documents.push(req.body.documentId);
    }

    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/documents/temp-upload/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document)
      return res.status(404).json({ message: "Document not found" });

    fs.unlinkSync(document.content);

    await Document.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Temporary document deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test/sample/session', (req, res) => {

  console.log('Session before saving user:', req.session  );

 
});


module.exports = router;
