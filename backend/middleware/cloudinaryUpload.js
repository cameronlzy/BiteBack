const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../helpers/cloudinary');


module.exports = function createParser(folderName = 'misc') {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `biteback/${folderName}`,
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
  });

  return multer({ 
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
};
