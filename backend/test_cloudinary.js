import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

console.log('Testing Cloudinary Credentials:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '(empty)');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? process.env.CLOUDINARY_API_KEY.slice(0, 4) + '***' : '(empty)');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***present***' : '(empty)');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function runTest() {
  try {
    const res = await cloudinary.api.ping();
    console.log('Cloudinary connection successful:', res);
  } catch (error) {
    console.error('Cloudinary rejected the request:');
    console.error('Status code:', error.http_code);
    console.error('Message:', error.message);
  }
}

runTest();