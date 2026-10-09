import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

console.log('[CLOUDINARY CONFIG]', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'LOADED' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'LOADED' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'LOADED' : 'MISSING',
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;