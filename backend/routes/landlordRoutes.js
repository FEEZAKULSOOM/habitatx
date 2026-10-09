import express from 'express';
import {
  getLandlordDashboard,
  updateLandlordListing,
  deleteLandlordListing,
} from '../controllers/landlordController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/dashboard', getLandlordDashboard);
router.patch('/listings/:id', updateLandlordListing);
router.delete('/listings/:id', deleteLandlordListing);

export default router;