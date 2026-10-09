import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// 1. Configure Multer memory storage (buffers files in RAM)
const storage = multer.memoryStorage();

// File filter: accept images only (jpeg, jpg, png, webp)
const fileFilter = (req, file, cb) => {
  console.log(`[UPLOAD FILTER] Processing incoming file: ${file.originalname} (${file.mimetype})`);

  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    console.warn(`[UPLOAD FILTER] Rejected non-image file: ${file.originalname}`);
    cb(new Error('Only image files (jpeg, jpg, png, webp) are permitted'), false);
  }
};

// Limit up to 5 images per listing, max 5 MB per file
export const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 5,
  },
}).array('images', 5);

// Helper function to stream a single buffer directly to Cloudinary
// Helper function to stream a single buffer directly to Cloudinary
const uploadBufferToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'habitat/listings',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY STREAM ERROR]:', JSON.stringify(error, null, 2));
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// 2. Cloudinary batch processing middleware
export const handleCloudinaryUpload = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      console.log('[CLOUDINARY] No binary files found in request; skipping file upload');
      return next();
    }

    console.log(`[CLOUDINARY] Uploading ${req.files.length} image(s) to Cloudinary...`);

    // Concurrently upload all buffered files to Cloudinary
    const uploadPromises = req.files.map((file) => uploadBufferToCloudinary(file.buffer));
    const imageUrls = await Promise.all(uploadPromises);

    console.log('[CLOUDINARY] Uploads completed successfully:', imageUrls);

    // Attach resulting URLs to req.body.images
    req.body.images = imageUrls;
    next();
  } catch (error) {
    const errorDetails = error.message || (typeof error === 'object' ? JSON.stringify(error) : error);
    console.error('[CLOUDINARY ERROR] Batch upload failed:', errorDetails);
    res.status(500).json({ message: 'Image upload failed: ' + errorDetails });
  }
};