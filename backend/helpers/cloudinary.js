import { v2 as cloudinary } from 'cloudinary';
import config from 'config';

cloudinary.config({
  cloud_name: config.get('cloudinary.cloudName'),
  api_key: config.get('cloudinary.apiKey'),
  api_secret: config.get('cloudinary.apiSecret'),
});

export default cloudinary;
