import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

// @desc    Add a review for a completed/confirmed booking
// @route   POST /api/reviews
// @access  Private (Tenant)
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({ message: 'Rating, comment, and booking ID are required.' });
    }

    // Verify booking exists, belongs to tenant, and is confirmed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to review this booking.' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Reviews can only be submitted for confirmed bookings.' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this stay.' });
    }

    const review = await Review.create({
      listing: booking.listing,
      tenant: userId,
      booking: bookingId,
      rating: Number(rating),
      comment: comment.trim(),
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('[REVIEW ERROR] createReview:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews and aggregate rating for a listing
// @route   GET /api/reviews/listing/:listingId
// @access  Public
export const getListingReviews = async (req, res) => {
  try {
    const { listingId } = req.params;

    const reviews = await Review.find({ listing: listingId })
      .populate('tenant', 'name avatar')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
        : 0;

    res.status(200).json({
      reviews,
      averageRating: Number(averageRating),
      totalReviews,
    });
  } catch (error) {
    console.error('[REVIEW ERROR] getListingReviews:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews left across landlord/admin's OWN properties only
// @route   GET /api/reviews/landlord
// @access  Private (Landlord / Admin)
export const getLandlordReviews = async (req, res) => {
  try {
    const isSuperAdmin = req.user.role === 'superadmin';

    let query = {};
    if (!isSuperAdmin) {
      // Find ONLY listings belonging to this specific landlord/admin
      const landlordListings = await Listing.find({ landlord: req.user._id }).select('_id');
      const listingIds = landlordListings.map((l) => l._id);
      query = { listing: { $in: listingIds } };
    }

    const reviews = await Review.find(query)
      .populate('listing', 'title address images')
      .populate('tenant', 'name email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json(reviews);
  } catch (error) {
    console.error('[REVIEW ERROR] getLandlordReviews:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/moderate an inappropriate review on host's own property
// @route   DELETE /api/reviews/:id
// @access  Private (Landlord of that property / Superadmin)
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id).populate('listing', 'landlord');

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    const isListingOwner = review.listing?.landlord?.toString() === req.user._id.toString();
    const isSuperAdmin = req.user.role === 'superadmin';

    // Strictly ensure only the owner of the listing (or platform superadmin) can remove it
    if (!isListingOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'Unauthorized: You do not own the property for this review.' });
    }

    await Review.findByIdAndDelete(id);

    res.status(200).json({ message: 'Review moderated and removed successfully.' });
  } catch (error) {
    console.error('[REVIEW ERROR] deleteReview:', error.message);
    res.status(500).json({ message: error.message });
  }
};