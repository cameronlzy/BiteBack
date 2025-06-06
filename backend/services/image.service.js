const cloudinary = require('cloudinary').v2;

exports.addImage = async(docModel, docId, uploadedFile, imageField = 'images') => {
    const imageUrl = uploadedFile.path;

    const doc = await docModel.findById(docId);
    if (!doc) return { status: 404, body: `${docModel.modelName} not found` };

    doc[imageField] = imageUrl;
    await doc.save();

    return { status: 200, body: doc.toObject() };
};

exports.addImages = async (docModel, docId, uploadedFiles, imageField = 'images') => {
    const imageUrls = uploadedFiles.map(file => file.path);

    const doc = await docModel.findById(docId);
    if (!doc) return { status: 404, body: `${docModel.modelName} not found` };

    doc[imageField].push(...imageUrls);
    await doc.save();

    return { status: 200, body: doc.toObject() };
};

// exports.deleteImages = async (docModel, docId, imageUrlsToDelete, imageField = 'images') => {
//   const doc = await docModel.findById(docId);
//   if (!doc) return { status: 404, body: `${docModel.modelName} not found` };

//   // removing deleted urls
//   doc[imageField] = doc[imageField].filter(url => !imageUrlsToDelete.includes(url));

//   await exports.deleteImagesFromCloudinary(imageUrlsToDelete);

//   await doc.save();

//   return {
//     status: 200,
//     body: {
//       deleted: imageUrlsToDelete,
//       failed: deleteResults
//         .filter(r => r.status === 'rejected')
//         .map((_, i) => imageUrlsToDelete[i])
//     }
//   };
// };

exports.deleteImagesFromDocument = async (doc, imageField = 'images') => {
  const imageUrlsToDelete = doc[imageField];
  await exports.deleteImagesFromCloudinary(imageUrlsToDelete);
};

exports.deleteImagesFromCloudinary = async (imageUrlsToDelete) => {
  const deleteResults = await Promise.allSettled(
    imageUrlsToDelete.map((url) => {
      const publicId = extractPublicIdFromUrl(url);
      return cloudinary.uploader.destroy(publicId);
    })
  );
  return deleteResults;
};

// helper function
function extractPublicIdFromUrl(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
};
