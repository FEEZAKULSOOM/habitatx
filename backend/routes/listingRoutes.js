import express from 'express';
import {
  createListing,
  getListings,
  getListingById,
} from '../controllers/listingController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';
import { uploadImages, handleCloudinaryUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router
  .route('/')
  .get(getListings)
  .post(
    protect,
   authorizeRoles('landlord', 'superadmin'),
    uploadImages,
    handleCloudinaryUpload,
    createListing
  );

router.route('/:id').get(getListingById);

export default router;