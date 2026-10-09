import express from 'express';
import {
  createReview,
  getListingReviews,
  getLandlordReviews,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public route to view reviews for a listing
router.route('/listing/:listingId').get(getListingReviews);

// Protected routes
router.use(protect);
router.route('/').post(createReview);
router.route('/landlord').get(getLandlordReviews);
router.route('/:id').delete(deleteReview);

export default router;