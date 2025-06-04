const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../helpers/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'biteback/restaurants',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const parser = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // limit to 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG are allowed.'));
    }
  },
});

module.exports = parser;
