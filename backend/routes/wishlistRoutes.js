import express from 'express';
import { toggleWishlist, getMyWishlist } from '../controllers/wishlistController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.route('/').get(getMyWishlist);
router.route('/:listingId').post(toggleWishlist);

export default router;