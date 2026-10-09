import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookingsAdmin,
  updateBookingStatus,
  getListingBookings,
  deleteBooking,
  dismissBooking,
  getBookingBadgeCount,
} from '../controllers/bookingController.js';
import { createCheckoutSession, finalizePayment } from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Logging middleware specifically for booking routes
router.use((req, res, next) => {
  console.log(`[BOOKING ROUTE] ${req.method} ${req.originalUrl}`);
  next();
});

// Public route: fetch booked date ranges for date picker
router.get('/listing/:listingId', getListingBookings);

// All routes below require authentication
router.use(protect);

// Actionable badge count (Must be after router.use(protect) so req.user exists)
router.get('/badge-count', getBookingBadgeCount);

// GET /api/bookings/admin/all - Allows admin/landlord to see all bookings
router.get('/admin/all', getAllBookingsAdmin);

// POST /api/bookings - Tenant initiates booking
router
  .route('/')
  .post(authorizeRoles('tenant'), createBooking)
  .get(getMyBookings);

// GET /api/bookings/my-bookings - Fetch history (filtered by tenant/landlord role)
router.get('/my-bookings', getMyBookings);

// PATCH /api/bookings/:id/dismiss - Dismisses rejected booking from tenant view without deleting from DB
router.patch('/:id/dismiss', dismissBooking);

// PATCH /api/bookings/:id/status - Landlord accepts/rejects, tenant cancels
router.patch('/:id/status', updateBookingStatus);

// DELETE /api/bookings/:id - Permanently cancel & remove booking from MongoDB
router.delete('/:id', deleteBooking);

// Safepay endpoints
router.post('/:id/checkout', createCheckoutSession);
router.post('/:id/finalize-payment', finalizePayment);

export default router;