import { v2 as cloudinary } from 'cloudinary';
import { error, success } from '../helpers/response.js';

export async function addImage(docModel, docId, uploadedFile, imageField = 'images') {
  const imageUrl = uploadedFile.path;

  const doc = await docModel.findById(docId);
  if (!doc) return error(404, `${docModel.modelName} not found`);

  doc[imageField] = imageUrl;
  await doc.save();

  return success(doc.toObject());
}

export async function addImages(docModel, docId, uploadedFiles, imageField = 'images') {
  const imageUrls = uploadedFiles.map(file => file.path);

  const doc = await docModel.findById(docId);
  if (!doc) return error(404, `${docModel.modelName} not found`);

  doc[imageField].push(...imageUrls);
  await doc.save();

  return success(doc.toObject());
}

export async function deleteImagesFromDocument(doc, imageField = 'images') {
  const raw = doc[imageField];
  if (!raw) return;

  const imageUrlsToDelete = Array.isArray(raw) ? raw : [raw];
  await deleteImagesFromCloudinary(imageUrlsToDelete);
}

export async function deleteImagesFromCloudinary(imageUrlsToDelete) {
  const deleteResults = await Promise.allSettled(
    imageUrlsToDelete.map((url) => {
      const publicId = extractPublicIdFromUrl(url);
      return cloudinary.uploader.destroy(publicId);
    })
  );
  return deleteResults;
}

// helper function
function extractPublicIdFromUrl(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
  return match ? match[1] : null;
};
